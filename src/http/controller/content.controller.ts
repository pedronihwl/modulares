import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ContentManagementService } from '@src/core/content-management';
import { CreateVideoResponseDto } from './dto/response/create-video';
import { RestResponseInterceptor } from './interceptors/rest-response';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentManagementService: ContentManagementService) { }

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
          if (file.fieldname === 'video' && file.mimetype !== "video/mp4") {
            return cb(new BadRequestException("Invalid file type. Only video/mp4 and image/jpeg are supported."), false);
          }
          if (file.fieldname === 'thumbnail' && file.mimetype !== "image/jpeg") {
            return cb(new BadRequestException("Invalid file type. Only video/mp4 and image/jpeg are supported."), false);
          }
          return cb(null, true);
        }
      }),
    new RestResponseInterceptor(CreateVideoResponseDto)
  )
  async uploadVideo(
    @Body() body: { title: string; description: string },
    @UploadedFiles()
    files: { video?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }): Promise<CreateVideoResponseDto> {

    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];

    if (!videoFile) {
      throw new BadRequestException("Video file is required");
    }

    if (!thumbnailFile) {
      throw new BadRequestException("Thumbnail file is required");
    }

    const createdContent = await this.contentManagementService.createContent({
      title: body.title,
      description: body.description,
      url: videoFile.path,
      thumbnailUrl: thumbnailFile.path,
      sizeInKb: videoFile.size
    });

    const video = createdContent.getMedia()?.getVideo();
    if (!video) {
      throw new BadRequestException('Video must be present');
    }

    return {
      id: createdContent.getId(),
      title: createdContent.getTitle(),
      description: createdContent.getDescription(),
      url: video.getUrl(),
      createdAt: createdContent.getCreatedAt(),
      updatedAt: createdContent.getUpdatedAt(),
    };
  }
}
