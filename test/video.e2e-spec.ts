import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@src/services/prisma-service';
import * as dotenv from 'dotenv';

import fs from 'fs';
import request from 'supertest';

describe("Video controller (e2e)", () => {
    let module: TestingModule
    let app: INestApplication
    let prisma: PrismaService

    beforeAll(async () => {
        dotenv.config({ quiet: true });

        module = await Test.createTestingModule({
            imports: [AppModule]
        }).compile()

        app = module.createNestApplication()
        await app.init()


        prisma = module.get<PrismaService>(PrismaService)
    })

    beforeEach(async () => {
        jest.useFakeTimers({ advanceTimers: true })
        jest.setSystemTime(new Date('2025-12-30'))
    })

    afterEach(async () => {
        prisma.video.deleteMany()
    })

    afterAll(async () => {
        module.close()
        fs.rmSync("./uploads", { recursive: true, force: true })
    })

    describe("[POST] /video", () => {
        it("uploads a video", async () => {
            const video: Omit<Prisma.VideoCreateInput, "createdAt" | "updatedAt"> = {
                id: "video-123",
                title: "Sample Video",
                description: "This is a test video",
                url: "/uploads/videos/sample.mp4",
                sizeInKb: 1024,
                duration: 120,
                thumbnailUrl: "/uploads/thumbnails/sample.jpg"
            }

            await request(app.getHttpServer())
                .post("/video")
                .attach("video", "./test/fixtures/sample.mp4")
                .attach("thumbnail", "./test/fixtures/sample.jpg")
                .field("title", video.title)
                .field("description", video.description)
                .expect(HttpStatus.CREATED)
                .expect((response) => {
                    expect(response.body).toMatchObject({
                        title: video.title,
                        description: video.description,
                        url: expect.stringContaining(".mp4"),
                        thumbnailUrl: expect.stringContaining(".jpg"),
                        sizeInKb: expect.any(Number),
                        duration: expect.any(Number)
                    })
                })

        })
    })
})