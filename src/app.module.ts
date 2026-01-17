import { Module } from '@nestjs/common';
import { ContentController } from './http/controller/content.controller';

import { PrismaService } from './persistence/prisma-service';
import { MediaPlayerService } from './core/media-player';
import { ContentManagementService } from './core/content-management';

@Module({
  imports: [],
  controllers: [ContentController],
  providers: [
    PrismaService, 
    ContentManagementService, 
    MediaPlayerService
  ]
})
export class AppModule {

}
