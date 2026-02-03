import { ConfigException } from "../exception/config.exception";
import { configSchema } from "./schema.config";
import { Config } from "./type.config";


export const factory = (): Config => {
    const result = configSchema.safeParse({
        env: process.env.NODE_ENV,
        port: process.env.PORT,
        database: {
            host: process.env.DATABASE_HOST,
            database: process.env.DATABASE_NAME,
            password: process.env.DATABASE_PASSWORD,
            port: process.env.DATABASE_PORT,
            url: process.env.DATABASE_URL,
            username: process.env.DATABASE_USERNAME,
        },
        movieDb: {
            url: process.env.MOVIE_DB_URL,
            apiToken: process.env.MOVIE_DB_API_TOKEN
        }
    });

    if (result.success) {
        return result.data;
    }

    throw new ConfigException(
        `Invalid application configuration: ${result.error.message}`,
    );
};