import express from "express";
import { adminRoutes } from "./authRoutes/adminRoutes.js";
import { customerRoutes } from "./authRoutes/customerRoutes.js";
import { productRoutes } from "./authRoutes/productRoutes.js";
import { orderRoutes } from "./authRoutes/orderRoutes.js";
import { orderItemRoutes } from "./authRoutes/orderItemRoutes.js";
import { reviewRoutes } from "./authRoutes/reviewRoutes.js";
import { otpRoutes } from "./authRoutes/otpRoutes.js";

const router = express.Router()

//admin route
router.use('/auth/admin', adminRoutes)

//customer route
router.use('/auth/customer', customerRoutes)

//product route
router.use('/auth/product', productRoutes)

//order route
router.use('/auth/order', orderRoutes)

//orderItems route
router.use('/auth/orderitem', orderItemRoutes)

//reviews route
router.use('/auth/review', reviewRoutes)

router.use('/auth/otp', otpRoutes)





export default router

