import { Module } from '@nestjs/common';
import { ContentController } from './http/controller/content.controller';
import { PersistenceModule } from '@contentModule/persistence/persistence.module';
import { ConfigModule } from '../shared/module/config/config.module';
import { ContentManagementService } from './core/service/content-managment.service';
import { MediaPlayerService } from './core/service/media-player.service';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { VideoRepository } from '@contentModule/persistence/repository/video.repository';
import { ExternalMovieClient } from './http/client/external-movie-rating.client';
import { MediaController } from './http/controller/media-player.controller';
import { HttpClientModule } from '@sharedModule/http-client/htpp-client.module';

@Module({
  imports: [PersistenceModule.forRoot(), ConfigModule.forRoot(), HttpClientModule],
  controllers: [ContentController, MediaController],
  providers: [
    ContentManagementService,
    MediaPlayerService,
    ContentRepository,
    VideoRepository,
    ExternalMovieClient
  ],
})
export class ContentModule {}
