import pg from 'pg'

import dotenv from "dotenv";

dotenv.config();

const {Pool} = pg

const db = new Pool(
  {
    connectionString : process.env.DATABASE_URL,
    ssl : {rejectUnauthorized : false} // for Railway
  },
 );

// measure db speed
const originalQuery = db.query
db.query = async function (...args){
  const dbStart = performance.now()
  const result = await originalQuery.apply(this, args)
  const duration = performance.now() - dbStart
  duration > 100 
  ? console.warn(` Slow query (${duration.toFixed(2)} ms): ${args[0]}`)
  : console.log(`Query took ${duration} ms -> ${args[0]}`);
  return result
}
export default db

