import Redis from "ioredis";


const redis = new Redis({
    host : `127.0.0.1`, 
    port : 6379
})

redis.on('connect', (err) => {
    err 
    ?  console.log('Redis failed: ', err)
    :  console.log('Redis is Connected') }
)
    
export default redis
























