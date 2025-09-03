import dotenv from 'dotenv';

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

import http from 'http'


import apiRoutes from './backend/routes/mainRoutes.js'

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
    console.log(`Server is running on http://localhost:${PORT}`)
})
















