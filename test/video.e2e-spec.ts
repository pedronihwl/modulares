import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@src/persistence/prisma-service';
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

    describe('[GET] /video/:videoId', () => {
        it('streams a video', async () => {
          const { body: sampleVideo } = await request(app.getHttpServer())
            .post('/video')
            .attach('video', './test/fixtures/sample.mp4')
            .attach('thumbnail', './test/fixtures/sample.jpg')
            .field('title', 'Test Video')
            .field('description', 'This is a test video')
            .expect(HttpStatus.CREATED);
    
          const fileSize = 18347;
          const range = `bytes=0-${fileSize - 1}`;
    
          const response = await request(app.getHttpServer())
            .get(`/video/${sampleVideo.id}`)
            .set('Range', range)
            .expect(HttpStatus.PARTIAL_CONTENT);
    
          expect(response.headers['content-range']).toBe(
            `bytes 0-${fileSize - 1}/${fileSize}`,
          );
          expect(response.headers['accept-ranges']).toBe('bytes');
          expect(response.headers['content-length']).toBe(String(fileSize));
          expect(response.headers['content-type']).toBe('video/mp4');
        });
    
        it('returns 404 if the video is not found', async () => {
          await request(app.getHttpServer())
            .get('/video/45705b56-a47f-4869-b736-8f6626c940f8')
            .expect(HttpStatus.NOT_FOUND);
        });
      });
})