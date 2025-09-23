import dotenv from 'dotenv';
import helmet from 'helmet';
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

import http from 'http'

import { paystackWebhook } from './backend/controllers/authControllers/orderControllers.js';
import apiRoutes from './backend/routes/mainRoutes.js'
import logger from './utils/logger.js';
import allowedOrigins from './backend/cors.js';
import { success } from 'zod';

dotenv.config()
// Reverse proxy for Railway
app.set('trust proxy', 1);
const app = express()


const server = http.createServer(app)


const PORT = process.env.PORT || 4000
//setting cors
app.use(
    cors({
        origin :function(origin, callback){
          if(!origin || allowedOrigins.includes(origin)){
            callback(null, true)
          }else{
            callback(new Error("Site not allowed by CORS"))
          }
        },
        methods : [ 'GET', 'POST', 'PATCH', 'DELETE'],
        credentials : true
    })
)

//mount webhook url to bypass express.json()
app.post("/api/order/webhook", express.raw({ type : "application/json"}), paystackWebhook)

// helmet set-up
if(process.env.NODE_ENV === 'production'){
  //Strict measure
  app.use(helmet())
}else{
  //Relaxed measure
  app.use(
    helmet({
      contentSecurityPolicy : {
        useDefaults : true,
        'script-src' : ['self', 'unsafe-inlie']
      }
    })
  )
}

//middleware
app.use(express.json())
app.use(cookieParser())


//routes
app.use('/api', apiRoutes)

app.get('/', (req, res)=>{
    res.status(200).send('Welcome to Nita Honey Biz')
})


server.listen(PORT, ()=>{
    logger.info(`Server started on port ${PORT}`|| 4000)
    console.log(`Server is running on http://localhost:${PORT}` )
})


process.on('uncaughtException', (err) => {
  logger.error("Uncaught Exception — shutting down", { message: err.message, stack: err.stack });
  process.exit(1); // exit to avoid undefined state
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error("Unhandled Rejection — shutting down", { reason, promise });
  process.exit(1);
});

// Catch wrong route 
app.use((req, res)=>{
    res.status(404).json(
      {
        success: false,
        error : "Route not found"
      })
})

// Error handler
app.use((err, req, res, next)=>{
  console.error("Unhandled error: ", err.stack)
  res.status(500).json(
    {
      success : false,
      error : "Internal server error"
    })
})

export default app;










