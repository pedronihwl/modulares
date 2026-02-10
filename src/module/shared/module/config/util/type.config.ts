import { z } from 'zod';
import { configSchema, environmentSchema } from './schema.config';

export type Environment = z.infer<typeof environmentSchema>;

export type Config = z.infer<typeof configSchema>;
