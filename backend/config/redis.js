import dotenv from 'dotenv'
import Redis from "ioredis";

dotenv.config()

let redis;

const devRedis = {
    host : `127.0.0.1`, 
    port : 6379}


const prodRedis =  process.env.REDIS_PUBLIC_URL 

if(process.env.NODE_ENV === 'production' ){
    console.log("Redis on Production")
    redis = new Redis(prodRedis)
} else redis = new Redis(devRedis)

redis.on('connect', (err) => {
    err 
    ?  console.log('Redis failed: ', err)
    :  console.log('Redis is Connected') }
)
    
export default redis
