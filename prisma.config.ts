import { defineConfig, env } from 'prisma/config'
import { loadEnvFile } from 'node:process'

loadEnvFile(".env")

export default defineConfig({
  schema: 'db/schema.prisma',
  migrations: {
    path: 'db/migrations'
  },
  datasource: {
    url: env('DATABASE_URL')
  }
})