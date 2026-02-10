import { Injectable } from '@nestjs/common';
import { ContentType } from '@contentModule/core/enum/content-type.enum';
import { ExternalMovieClient } from '@contentModule/http/client/external-movie-rating.client';
import { Content } from '@contentModule/persistence/entity/content.entity';
import { Movie } from '@contentModule/persistence/entity/movie.entity';
import { Thumbnail } from '@contentModule/persistence/entity/thumbnail.entity';
import { Video } from '@contentModule/persistence/entity/video.entity';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';

export interface CreateMovieData {
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  sizeInKb: number;
}

@Injectable()
export class ContentManagementService {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly externalClient: ExternalMovieClient,
  ) {}

  async createMovie(createMovieData: CreateMovieData): Promise<Content> {
    const externalRating = await this.externalClient.getRating(
      createMovieData.title,
    );

    const video = new Video({
      url: createMovieData.url,
      duration: 10,
      sizeInKb: createMovieData.sizeInKb,
    });

    const movieData: Partial<Movie> = {
      externalRating: externalRating,
      video: video,
    };

    if (createMovieData.thumbnailUrl) {
      movieData.thumbnail = new Thumbnail({
        url: createMovieData.thumbnailUrl,
      });
    }

    const movie = new Movie(movieData);

    const contentEntity = new Content({
      title: createMovieData.title,
      description: createMovieData.description,
      type: ContentType.MOVIE,
      movie: movie,
    });

    // Avaliar se há a necessidade realmente de retornar um DTO
    // As vezes, o serviço pode ser reutilizado internamente, o que desconsidera a necessidade de um DTO

    const content = await this.contentRepository.save(contentEntity);

    return content;
  }
}
