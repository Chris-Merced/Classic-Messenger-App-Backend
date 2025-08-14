"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production"]).default("development"),
    DATABASE_URL: zod_1.z.string().min(1),
    LOCAL_DATABASE_URL: zod_1.z.string().optional(),
    FRONTEND_OAUTH_URL: zod_1.z.string().url(),
    OAUTH_SECRET: zod_1.z.string().min(1),
    OAUTH_CLIENTID: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().optional(),
    AWS_ACCESS_KEY_ID: zod_1.z.string().min(1),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().min(1),
    AWS_REGION: zod_1.z.string().min(1),
    AWS_S3_BUCKET: zod_1.z.string().min(1),
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
});
exports.env = EnvSchema.parse(process.env);
//# sourceMappingURL=env.js.map