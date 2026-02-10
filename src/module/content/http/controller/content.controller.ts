import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { CreateVideoResponseDto } from './dto/response/create-video';
import { RestResponseInterceptor } from './interceptors/rest-response';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ContentManagementService } from '@contentModule/core/service/content-managment.service';
import { MulterExceptionFilter } from '../filters/multer-exception.filter';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(
    private readonly contentManagementService: ContentManagementService,
  ) {}

  @Post('video')
  // Precisei fazer isso por que o Multer estava retornando ECONNRESET
  @UseFilters(MulterExceptionFilter)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload de vídeo',
    description:
      'Faz upload de um arquivo de vídeo (MP4) junto com sua thumbnail (JPEG). Os arquivos são armazenados em ./uploads com nomes únicos gerados automaticamente.',
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
          example: 'Meu Vídeo Incrível',
        },
        description: {
          type: 'string',
          description: 'Descrição do vídeo',
          example: 'Este é um vídeo demonstrativo',
        },
        video: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de vídeo no formato MP4',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Imagem de capa no formato JPEG',
        },
      },
    },
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
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Requisição inválida - arquivo de vídeo ou thumbnail ausente, ou formato inválido (apenas video/mp4 e image/jpeg são aceitos)',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        dest: './uploads',
        storage: diskStorage({
          destination: './uploads',
          filename: (_red, file, cb) => {
            return cb(
              null,
              `${Date.now()}-${randomUUID()}${extname(file.originalname)}`,
            );
          },
        }),
        fileFilter: (req: any, file, cb) => {
          // Don't reject here - just mark as invalid and handle in controller
          if (file.mimetype !== 'video/mp4' && file.mimetype !== 'image/jpeg') {
            // Mark that a file was rejected due to invalid type
            req.invalidFileType = true;
            // Pass null to not store the file
            return cb(null, false);
          }
          return cb(null, true);
        },
      },
    ),
    new RestResponseInterceptor(CreateVideoResponseDto),
  )
  async uploadVideo(
    @Body()
    contentData: {
      title: string;
      description: string;
    },
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Req() req: any,
  ): Promise<CreateVideoResponseDto> {
    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];

    // If files were filtered out due to invalid type, they won't be in the files object
    if (!videoFile || !thumbnailFile) {
      // Check if this is due to file filtering or missing upload
      if (req.invalidFileType) {
        throw new BadRequestException(
          'Invalid file type. Only video/mp4 and image/jpeg are supported.',
        );
      }
      throw new BadRequestException(
        'Both video and thumbnail files are required.',
      );
    }

    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 gigabyte

    if (videoFile.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds the limit.');
    }
    const MAX_THUMBNAIL_SIZE = 1024 * 1024 * 10; // 10 megabytes

    if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
      throw new BadRequestException('Thumbnail size exceeds the limit.');
    }

    if (!videoFile || !thumbnailFile) {
      throw new BadRequestException(
        'Both video and thumbnail files are required.',
      );
    }

    const createdMovie = await this.contentManagementService.createMovie({
      title: contentData.title,
      description: contentData.description,
      url: videoFile.path,
      thumbnailUrl: thumbnailFile.path,
      sizeInKb: videoFile.size,
    });
    return {
      id: createdMovie.id,
      title: createdMovie.title,
      description: createdMovie.description,
      url: createdMovie.movie.video.url,
      thumbnailUrl: createdMovie.movie.thumbnail?.url,
      sizeInKb: createdMovie.movie.video.sizeInKb,
      duration: createdMovie.movie.video.duration,
      createdAt: createdMovie.createdAt,
      updatedAt: createdMovie.updatedAt,
    };
  }
}
