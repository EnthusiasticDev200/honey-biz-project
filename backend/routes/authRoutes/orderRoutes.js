import express  from "express";
import { createOrder, viewOrders, customerOrder, orderCheckOut, verifyPayment } from "../../controllers/authControllers/orderControllers.js";
import { customerOnly, requireSuperUser, validateJWTAcessToken } from "../../../middlewares/auth.js";
import { adminOnly } from "../../../middlewares/auth.js";

const router = express.Router()

// removed createOrderValidation for payment method
router.post('/create', validateJWTAcessToken, customerOnly, createOrder)

router.get(
    ['/view', '/view/:order_id', '/view/customer/:customer_id'],
     validateJWTAcessToken, requireSuperUser, viewOrders)

router.get('/myorder', validateJWTAcessToken, customerOnly, customerOrder)

router.post('/myorder/:order_id/checkout', validateJWTAcessToken, customerOnly, orderCheckOut)

router.post('/myorder/:order_id/verify', validateJWTAcessToken, adminOnly, verifyPayment)

export {router as orderRoutes}



























