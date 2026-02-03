import { Module } from '@nestjs/common';
import { ContentController } from './http/controller/content.controller';
import { VideoRepository } from './persistence/repository/video.repository';
import { ContentRepository } from './persistence/repository/content.repository';
import { MediaController } from './http/controller/media-player.controller';
import { PersistenceModule } from './persistence/persistence.module';
import { ContentManagementService } from './core/service/content-managment.service';
import { MediaPlayerService } from './core/service/media-player.service';

@Module({
  imports: [PersistenceModule.forRoot()],
  controllers: [ContentController, MediaController],
  providers: [
    ContentManagementService, 
    MediaPlayerService,
    ContentRepository,
    VideoRepository
  ]
})
export class AppModule {

}
