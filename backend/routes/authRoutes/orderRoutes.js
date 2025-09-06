import express  from "express";
import { createOrder, viewOrders, customerOrder } from "../../controllers/authControllers/orderControllers.js";
import { customerOnly, requireSuperUser, validateJWTAcessToken } from "../../../middlewares/auth.js";
//import { createOrderValidation } from "../../../middlewares/validation.js";

const router = express.Router()

// removed createOrderValidation for payment method
router.post('/create', validateJWTAcessToken, customerOnly, createOrder)

router.get(
    ['/view', '/view/:order_id', '/view/customer/:customer_id'],
     validateJWTAcessToken, requireSuperUser, viewOrders)

router.get('/myorder', validateJWTAcessToken, customerOnly, customerOrder)



export {router as orderRoutes}



























