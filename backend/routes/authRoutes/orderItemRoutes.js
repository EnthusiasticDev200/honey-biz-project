import express from 'express'
import { generateOrderItems, myOrderItems, viewOrderItems } from '../../controllers/authControllers/orderItemControllers.js'
import { validateJWTAcessToken, customerOnly, requireSuperUser } from '../../../middlewares/auth.js'

const router = express.Router()





router.post('/createitem', validateJWTAcessToken, customerOnly, generateOrderItems)

router.get('/myitem', validateJWTAcessToken, customerOnly, myOrderItems)

//superuser
router.get(['/view', '/view/order/:order_id'], validateJWTAcessToken, requireSuperUser,viewOrderItems)








export {router as orderItemRoutes}



























