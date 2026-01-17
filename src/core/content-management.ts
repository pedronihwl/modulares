import { Injectable } from "@nestjs/common";
import { PrismaService } from "@src/persistence/prisma-service";
import { randomUUID } from "crypto";


interface BodyVideoDto {
    id: string,
    title: string,
    description: string,
    url: string,
    sizeInKb: number,
    duration: number,
    thumbnailUrl: string,
    createdAt: Date,
    updatedAt: Date,
}

@Injectable()
export class ContentManagementService {

    constructor(private readonly prismaService: PrismaService){

    }

    async addVideo(dto: BodyVideoDto){
        const video = await this.prismaService.video.create({
            data: {
              id: randomUUID(),
              title: dto.title,
              description: dto.description,
              url: dto.url,
              sizeInKb: dto.sizeInKb,
              duration: dto.duration,
              thumbnailUrl: dto.thumbnailUrl,
              createdAt: dto.createdAt,
              updatedAt: dto.updatedAt
            }
          });

          return video;

    }
}