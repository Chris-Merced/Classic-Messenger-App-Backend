import {env} from "./env";


const config = {
  development: {
    connectionString:
      env.DATABASE_URL || env.LOCAL_DATABASE_URL,
  },
  production: {
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
}

module.exports = config[env.NODE_ENV || 'development']
