import { BadRequestException, Body, Controller, Get, Header, HttpCode, HttpStatus, NotFoundException, Param, Post, Req, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../persistence/prisma-service';
import path, { extname } from 'path';
import fs from 'fs';
import type { Request, Response } from 'express';
import { ContentManagementService } from '@src/core/content-management';
import { MediaPlayerService } from '@src/core/media-player';
import { plainToInstance } from 'class-transformer';
import { CreateVideoResponseDto } from './dto/response/create-video';
import { validate } from 'class-validator';
import { RestResponseInterceptor } from './interceptors/rest-response';
import { error } from 'console';
import { VideoNotFoundException } from '@src/core/exceptions/video-not-found.exceptions';

@ApiTags('Content')
@Controller()
export class ContentController {
  constructor(private readonly contentManagementService: ContentManagementService, private readonly prepareVideoService: MediaPlayerService) { }

  @Post("video")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload de vídeo',
    description: 'Faz upload de um arquivo de vídeo (MP4) junto com sua thumbnail (JPEG). Os arquivos são armazenados em ./uploads com nomes únicos gerados automaticamente.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'video', 'thumbnail'],
      properties: {
        title: {
          type: 'string',
          description: 'Título do vídeo',
          example: 'Meu Vídeo Incrível'
        },
        description: {
          type: 'string',
          description: 'Descrição do vídeo',
          example: 'Este é um vídeo demonstrativo'
        },
        video: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de vídeo no formato MP4'
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Imagem de capa no formato JPEG'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Vídeo criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        description: { type: 'string' },
        url: { type: 'string' },
        sizeInKb: { type: 'number' },
        duration: { type: 'number' },
        thumbnailUrl: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - arquivo de vídeo ou thumbnail ausente, ou formato inválido (apenas video/mp4 e image/jpeg são aceitos)'
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
      ],
      {
        dest: "./uploads",
        storage: diskStorage({
          destination: "./uploads",
          filename: (_red, file, cb) => {
            return cb(null, `${Date.now()}-${randomUUID()}${extname(file.originalname)}`)
          }
        }),
        fileFilter: (_req, file, cb) => {
          if (file.mimetype !== "video/mp4" && file.mimetype !== "image/jpeg") {
            return cb(new BadRequestException("Invalid file format, only video/mp4 and image/jpeg are supported"), false)
          }
          return cb(null, true)
        }
      }),
    new RestResponseInterceptor(CreateVideoResponseDto)
  )
  async uploadVideo(
    @Body() body: { title: string; description: string },
    @UploadedFiles()
    files: { video?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }) : Promise<CreateVideoResponseDto> {

    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];

    if (!videoFile) {
      throw new BadRequestException("Video file is required");
    }

    if (!thumbnailFile) {
      throw new BadRequestException("Thumbnail file is required");
    }

    const video = await this.contentManagementService.addVideo({
      id: randomUUID(),
      title: body.title,
      description: body.description,
      url: videoFile.path,
      sizeInKb: videoFile.size,
      duration: 100,
      thumbnailUrl: thumbnailFile.path,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return video;
  }


  @Get("video/:videoId")
  @Header('Content-Type', 'video/mp4')
  @ApiOperation({
    summary: 'Stream de vídeo',
    description: 'Faz streaming de vídeo com suporte a partial content (HTTP Range Requests). Permite navegação livre na timeline do vídeo sem necessidade de baixar o arquivo completo.'
  })
  @ApiParam({
    name: 'videoId',
    type: 'string',
    description: 'ID único do vídeo a ser reproduzido',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiHeader({
    name: 'Range',
    required: false,
    description: 'Range de bytes para solicitar uma parte específica do vídeo',
    example: 'bytes=0-1023',
    schema: { type: 'string' }
  })
  @ApiResponse({
    status: 200,
    description: 'Vídeo completo retornado com sucesso',
    headers: {
      'Content-Length': {
        description: 'Tamanho total do arquivo em bytes',
        schema: { type: 'number' }
      },
      'Content-Type': {
        description: 'Tipo do conteúdo',
        schema: { type: 'string', example: 'video/mp4' }
      }
    }
  })
  @ApiResponse({
    status: 206,
    description: 'Partial content - parte do vídeo retornada com sucesso (quando Range header está presente)',
    headers: {
      'Content-Range': {
        description: 'Range de bytes sendo retornado',
        schema: { type: 'string', example: 'bytes 0-1023/5000000' }
      },
      'Accept-Ranges': {
        description: 'Indica que o servidor aceita requisições de range',
        schema: { type: 'string', example: 'bytes' }
      },
      'Content-Length': {
        description: 'Tamanho do chunk sendo retornado',
        schema: { type: 'number' }
      }
    }
  })
  async streamVideo(
    @Param("videoId") id: string,
    @Req() _req: Request,
    @Res() _res: Response) {

    const file = await this.prepareVideoService.prepareVideo(id);

    try {
      const videoPath = path.join('.', file.url);
      const fileSize = fs.statSync(videoPath).size;

      const range = _req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = end - start + 1;
        const file = fs.createReadStream(videoPath, { start, end });

        _res.writeHead(HttpStatus.PARTIAL_CONTENT, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        });

        return file.pipe(_res);
      }

      _res.writeHead(HttpStatus.OK, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      const videoStream = fs.createReadStream(videoPath);
      return videoStream.pipe(_res);
    } catch (error) {
      if (error instanceof VideoNotFoundException) {
        return _res.status(HttpStatus.NOT_FOUND).send({
          message: error.message,
          error: "Not Found",
          statusCode: HttpStatus.NOT_FOUND
        })
      }
      throw error;
    }
  }
}
