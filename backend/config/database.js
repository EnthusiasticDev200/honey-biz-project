import pg from 'pg'
import dotenv from "dotenv";

dotenv.config();

const {Pool} = pg

const db = new Pool(
  {
    'user':process.env.DB_USERNAME,
    'password': process.env.DB_PASSWORD,
    'host': process.env.DB_HOST,
    'port': process.env.DB_PORT,
    'database':process.env.DB_NAME,
  }
 );

//  

export default db

