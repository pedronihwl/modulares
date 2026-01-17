import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@src/persistence/prisma-service";
import { VideoNotFoundException } from "./exceptions/video-not-found.exceptions";

@Injectable()
export class MediaPlayerService {

    constructor(private readonly prismaService: PrismaService) {

    }

    async prepareVideo(videoId: string) {
        const file = await this.prismaService.video.findUnique({
            where: {
                id: videoId
            }
        })

        if (!file) {
            throw new VideoNotFoundException(`Video with id ${videoId} not found`)
        }

        return file
    }
}