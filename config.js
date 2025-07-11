require('dotenv').config()

const config = {
  development: {
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  },
  production: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
}

module.exports = config[process.env.NODE_ENV || 'development']
