import express from 'express'
import { generateOrderItems, myOrderItems, viewOrderItems } from '../../controllers/authControllers/orderItemControllers.js'
import { validateJWTAcessToken, customerOnly, requireSuperUser } from '../../../middlewares/auth.js'

import { authLimiter, apiLimiter } from '../../../middlewares/rateLimiter.js'


const router = express.Router()





router.post('/createitem', apiLimiter, validateJWTAcessToken, customerOnly, generateOrderItems)

router.get('/myitem', apiLimiter, validateJWTAcessToken, customerOnly, myOrderItems)

//superuser
router.get(['/view', '/view/order/:order_id'], apiLimiter, validateJWTAcessToken, requireSuperUser,viewOrderItems)








export {router as orderItemRoutes}



























