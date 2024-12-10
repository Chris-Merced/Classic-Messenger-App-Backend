const { Pool } = require("pg");

module.exports = new Pool({
  connectionString: "postgresql://christopher:Mrc12598!@localhost:5432/classicmessenger",
});
