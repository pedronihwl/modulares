import {
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import path from 'path';
import fs from 'fs';
import { VideoNotFoundException } from '@contentModule/core/exceptions/video-not-found.exceptions';
import { MediaPlayerService } from '@contentModule/core/service/media-player.service';

@ApiTags('Streaming')
@Controller('stream')
export class MediaController {
  constructor(private readonly mediaPlayerService: MediaPlayerService) {}

  @Get(':videoId')
  @Header('Content-Type', 'video/mp4')
  @ApiOperation({
    summary: 'Stream de vídeo',
    description:
      'Faz streaming de vídeo com suporte a partial content (HTTP Range Requests). Permite navegação livre na timeline do vídeo sem necessidade de baixar o arquivo completo.',
  })
  @ApiParam({
    name: 'videoId',
    type: 'string',
    description: 'ID único do vídeo a ser reproduzido',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiHeader({
    name: 'Range',
    required: false,
    description: 'Range de bytes para solicitar uma parte específica do vídeo',
    example: 'bytes=0-1023',
    schema: { type: 'string' },
  })
  @ApiResponse({
    status: 200,
    description: 'Vídeo completo retornado com sucesso',
    headers: {
      'Content-Length': {
        description: 'Tamanho total do arquivo em bytes',
        schema: { type: 'number' },
      },
      'Content-Type': {
        description: 'Tipo do conteúdo',
        schema: { type: 'string', example: 'video/mp4' },
      },
    },
  })
  @ApiResponse({
    status: 206,
    description:
      'Partial content - parte do vídeo retornada com sucesso (quando Range header está presente)',
    headers: {
      'Content-Range': {
        description: 'Range de bytes sendo retornado',
        schema: { type: 'string', example: 'bytes 0-1023/5000000' },
      },
      'Accept-Ranges': {
        description: 'Indica que o servidor aceita requisições de range',
        schema: { type: 'string', example: 'bytes' },
      },
      'Content-Length': {
        description: 'Tamanho do chunk sendo retornado',
        schema: { type: 'number' },
      },
    },
  })
  async streamVideo(
    @Param('videoId') id: string,
    @Req() _req: Request,
    @Res() _res: Response,
  ) {
    try {
      const url = await this.mediaPlayerService.prepareStreaming(id);
      const videoPath = path.join('.', url);
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
      console.warn('ENTROU', error);
      if (error instanceof VideoNotFoundException) {
        return _res.status(HttpStatus.NOT_FOUND).send({
          message: error.message,
          error: 'Not Found',
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
      throw error;
    }
  }
}
