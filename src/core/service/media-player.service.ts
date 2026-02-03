import { Injectable } from '@nestjs/common';
import { VideoRepository } from '@src/persistence/repository/video.repository';
import { VideoNotFoundException } from '@src/core/exceptions/video-not-found.exceptions';

@Injectable()
export class MediaPlayerService {
  constructor(private readonly videoRepository: VideoRepository) {}

  async prepareStreaming(videoId: string): Promise<string> {
    const video = await this.videoRepository.findOneById(videoId);
    if (!video) {
      throw new VideoNotFoundException(`video with id ${videoId} not found`);
    }
    return video.url;
  }
}