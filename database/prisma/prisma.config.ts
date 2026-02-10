import { defineConfig } from 'prisma/config'
import dotenv from 'dotenv'

dotenv.config({
    path: "../../.env",
    quiet: true
})

const {
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USERNAME,
    DATABASE_PASSWORD,
    DATABASE_NAME,
} = process.env

const url = `postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}` + `@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=identity,test`

export default defineConfig({
    schema: './schema.prisma',
    migrations: {
        path: './migrations'
    },
    datasource: {
        url
    }
})

