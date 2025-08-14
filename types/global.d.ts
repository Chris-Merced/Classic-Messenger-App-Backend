declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "production" | "test";
    DATABASE_URL?: string;
    LOCAL_DATABASE_URL?: string;
    FRONTEND_OAUTH_URL?: string;
    OAUTH_SECRET?: string;
    OAUTH_CLIENTID?: string;
    REDIS_URL?: string;
    JWT_SECRET?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    AWS_S3_BUCKET?: string;
  }
}