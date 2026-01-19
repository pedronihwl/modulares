import { Injectable, NotFoundException } from "@nestjs/common";
import { VideoNotFoundException } from "./exceptions/video-not-found.exceptions";
import { VideoRepository } from "@src/persistence/repository/video.repository";

@Injectable()
export class MediaPlayerService {

    constructor(private readonly videoRepository: VideoRepository) {

    }

    async prepareStreaming(videoId: string): Promise<string> {
        const video = await this.videoRepository.findById(videoId);
        if (!video) {
            throw new VideoNotFoundException(`video with id ${videoId} not found`);
        }
        return video.getUrl();
    }
}