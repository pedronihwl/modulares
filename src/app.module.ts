import { Module } from '@nestjs/common';
import { ContentController } from './http/controller/content.controller';

import { PrismaService } from './persistence/prisma-service';
import { MediaPlayerService } from './core/media-player';
import { ContentManagementService } from './core/content-management';
import { VideoRepository } from './persistence/repository/video.repository';
import { ContentRepository } from './persistence/repository/content.repository';
import { MediaController } from './http/controller/media.controller';

@Module({
  imports: [],
  controllers: [ContentController, MediaController],
  providers: [
    PrismaService, 
    ContentManagementService, 
    MediaPlayerService,
    ContentRepository,
    VideoRepository
  ]
})
export class AppModule {

}
