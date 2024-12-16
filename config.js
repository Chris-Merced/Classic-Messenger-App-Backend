require("dotenv").config();

const config = {
  development: {
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://christopher:Mrc12598!@localhost:5432/classicmessenger",
  },
  production: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

module.exports = config[process.env.NODE_ENV || "development"];
