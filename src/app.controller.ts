import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PrismaService } from './services/prisma-service';

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
}
