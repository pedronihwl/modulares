import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma-service";
import { ContentEntity } from "@src/core/entity/content.entity";
import { Prisma } from "db/generated/client";
import { ThumbnailEntity } from "@src/core/entity/thumbnail.entity";
import { VideoEntity } from "@src/core/entity/video.entity";
import { MovieEntity } from "@src/core/entity/movie.entity";


const contentInclude = {
    movie: {
        include: {
            video: true,
            thumbnail: true,
        }
    },
} satisfies Prisma.ContentInclude;

@Injectable()
export class ContentRepository {
    private readonly model: PrismaService['content'];

    /**
     * Cria a propriedade internamente, mas só precisamos dela no constructor
     * constructor(private readonly prismaService: PrismaService){
        this.model = prismaService.content
    }
     */

    constructor(prismaService: PrismaService) {
        this.model = prismaService.content
    }

    async create(content: ContentEntity): Promise<ContentEntity> {
        try {
            const movie = content.getMedia();
            if (!movie) {
                throw new Error('Movie must be provided');
            }
            const video = movie.getVideo();

            await this.model.create({
                data: {
                    id: content.getId(),
                    title: content.getTitle(),
                    description: content.getDescription(),
                    type: content.getType(),
                    createdAt: content.getCreatedAt(),
                    updatedAt: content.getUpdatedAt(),
                    movie: {
                        create: {
                            id: movie.getId(),
                            video: {
                                create: video.serialize(),
                            },
                            thumbnail: {
                                create: movie.getThumbnail()?.serialize(),
                            },
                        },
                    },
                },
            });

            return content;
        } catch (error) {
            this.handleAndThrowError(error);
        }
    }

    async findById(id: string) {
        const content = await this.model.findUniqueOrThrow({
            where: {
                id
            },
            include: {
                movie: {
                    include: {
                       video: true,thumbnail: true
                    }
                }
            }
        })

        return this.mapToEntity(content)
    }

    private mapToEntity<T extends Prisma.ContentGetPayload<{ include: typeof contentInclude }>>(content: T): ContentEntity {

        if (!content.movie) {
            throw new Error('Movie must be defined');
        }

        const contentEntity = ContentEntity.createFrom({
            id: content.id,
            type: content.type,
            title: content.title,
            description: content.description,
            createdAt: new Date(content.createdAt),
            updatedAt: new Date(content.updatedAt),
        });
        if (this.isMovie(content) && content.movie.video) {
            contentEntity.addMedia(
                MovieEntity.createFrom({
                    id: content.movie.id,
                    createdAt: new Date(content.movie.createdAt),
                    updatedAt: new Date(content.movie.updatedAt),
                    video: VideoEntity.createFrom({
                        id: content.movie.video.id,
                        url: content.movie.video.url,
                        duration: content.movie.video.duration,
                        sizeInKb: content.movie.video.sizeInKb,
                        createdAt: new Date(content.movie.video.createdAt),
                        updatedAt: new Date(content.movie.video.updatedAt),
                    }),
                }),
            );
            if (content.movie.thumbnail) {
                contentEntity.getMedia()?.addThumbnail(
                    ThumbnailEntity.createFrom({
                        id: content.movie.thumbnail.id,
                        url: content.movie.thumbnail.url,
                        createdAt: new Date(content.movie.thumbnail.createdAt),
                        updatedAt: new Date(content.movie.thumbnail.updatedAt),
                    }),
                );
            }
        }
        return contentEntity;
    }

    private isMovie(content: unknown): content is Prisma.ContentGetPayload<{
        include: {
            movie: {
                include: { video: true }
            }
        }
    }> {

        if (typeof content === 'object' && content !== null && 'Movie' in content) {
            return true
        }

        return false
    }

    async clear(): Promise<{ count: number }> {
        try {
            return await this.model.deleteMany()
        } catch(error) {
            this.handleAndThrowError(error)
        }
    }

    private extractErrorMessage(error: unknown): string {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return 'An unexpected error occurred.';
    }

    protected handleAndThrowError(error: unknown): never {
        const errorMessage = this.extractErrorMessage(error);
        if (error instanceof Prisma.PrismaClientValidationError) {
            throw new Error(error.message);
        }

        throw new Error(errorMessage);
    }
}