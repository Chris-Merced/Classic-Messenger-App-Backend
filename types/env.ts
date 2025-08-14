import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  LOCAL_DATABASE_URL: z.string().optional(),
  FRONTEND_OAUTH_URL: z.string().url(),
  OAUTH_SECRET: z.string().min(1),
  OAUTH_CLIENTID: z.string().min(1),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
});

export const env = EnvSchema.parse(process.env);