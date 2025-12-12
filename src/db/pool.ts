import {Pool} from 'pg'
import config from '../config'

const pool = null;
try {
  const pool = new Pool(config)
  
} catch (err) {
  console.error('Error creating pool:', err)
  throw err
}
export default pool