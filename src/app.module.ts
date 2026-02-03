import { Module } from '@nestjs/common';
import { ContentController } from './http/controller/content.controller';
import { VideoRepository } from './persistence/repository/video.repository';
import { ContentRepository } from './persistence/repository/content.repository';
import { MediaController } from './http/controller/media-player.controller';
import { PersistenceModule } from './persistence/persistence.module';
import { ContentManagementService } from './core/service/content-managment.service';
import { MediaPlayerService } from './core/service/media-player.service';
import { ExternalMovieClient } from './http/client/external-movie-rating.client';
import { HttpClient } from './infra/module/http/client/http.client';
import { ConfigModule } from './infra/module/config/config.module';

@Module({
  imports: [PersistenceModule.forRoot(), ConfigModule.forRoot()],
  controllers: [ContentController, MediaController],
  providers: [
    ContentManagementService, 
    MediaPlayerService,
    ContentRepository,
    VideoRepository,
    ExternalMovieClient,
    HttpClient
  ]
})
export class AppModule {

}
