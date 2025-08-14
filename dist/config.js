"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./env");
const config = {
    development: {
        connectionString: env_1.env.DATABASE_URL || env_1.env.LOCAL_DATABASE_URL,
    },
    production: {
        connectionString: env_1.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },
};
module.exports = config[env_1.env.NODE_ENV || 'development'];
//# sourceMappingURL=config.js.map