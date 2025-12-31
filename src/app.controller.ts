import { BadRequestException, Body, Controller, Get, Header, HttpCode, HttpStatus, NotFoundException, Param, Post, Req, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { PrismaService } from './services/prisma-service';
import path, { extname } from 'path';
import fs from 'fs';
import type { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly prismaService: PrismaService) { }

  @Post("video")
  @HttpCode(HttpStatus.CREATED)
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
      })
  )
  async uploadVideo(
    @Body() body: { title: string; description: string },
    @UploadedFiles()
    files: { video?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }) {

    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];

    if (!videoFile) {
      throw new BadRequestException("Video file is required");
    }

    if (!thumbnailFile) {
      throw new BadRequestException("Thumbnail file is required");
    }

    const video = await this.prismaService.video.create({
      data: {
        id: randomUUID(),
        title: body.title,
        description: body.description,
        url: videoFile.path,
        sizeInKb: videoFile.size,
        duration: 100,
        thumbnailUrl: thumbnailFile.path,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return video;
  }


  @Get("video/:videoId")
  @Header('Content-Type', 'video/mp4')
  async streamVideo(
    @Param("videoId") id: string,
    @Req() _req: Request,
    @Res() _res: Response) {

    const file = await this.prismaService.video.findUnique({
      where: {
        id
      }
    })

    if (!file) {
      throw new NotFoundException(`Video with id ${id} not found`)
    }

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
  }
}
