import express from 'express'
import { generateOrderItems } from '../../controllers/authControllers/orderItemControllers.js'
import { validateJWTAcessToken, customerOnly } from '../../../middlewares/auth.js'

const router = express.Router()





router.post('/myItems', validateJWTAcessToken, customerOnly, generateOrderItems)








export {router as orderItemRouter}



























