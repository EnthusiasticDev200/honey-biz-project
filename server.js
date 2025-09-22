import dotenv from 'dotenv';
import helmet from 'helmet';
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

import http from 'http'

import { paystackWebhook } from './backend/controllers/authControllers/orderControllers.js';
import apiRoutes from './backend/routes/mainRoutes.js'
import logger from './utils/logger.js';

dotenv.config()
const app = express()

const server = http.createServer(app)


const PORT = process.env.APP_PORT
//setting cors
app.use(
    cors({
        origin : `http://localhost:${PORT}`,
        methods : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE' ],
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


// app.use('', (req, res)=>{
//     res.status(404).json({message: 'Route not found'})
// })

server.listen(PORT, ()=>{
    logger.info(`Server started on port ${PORT}`)
    console.log(`Server is running on http://localhost:${PORT}`)
})


process.on('uncaughtException', (err) => {
  logger.error("Uncaught Exception — shutting down", { message: err.message, stack: err.stack });
  process.exit(1); // exit to avoid undefined state
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error("Unhandled Rejection — shutting down", { reason, promise });
  process.exit(1);
});


export default app;










