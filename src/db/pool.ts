import { Pool } from "pg";
import config from "../config";

let pool: Pool;
try {
  pool = new Pool(config);
} catch (err) {
  console.error("Error creating pool:", err);
  throw err;
}

export default pool;
