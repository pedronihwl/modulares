import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma-service";
import { ContentEntity } from "@src/core/entity/content.entity";
import { Prisma } from "db/generated/client";

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
                    Movie: {
                        create: {
                            id: movie.getId(),
                            Video: {
                                create: video.serialize(),
                            },
                            Thumbnail: {
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