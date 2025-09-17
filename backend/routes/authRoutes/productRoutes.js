import express from "express";
import { createProduct } from "../../controllers/authControllers/productControllers.js";
import { productValidation } from "../../../middlewares/validation.js";
import { requireSuperUser } from "../../../middlewares/auth.js";
import { validateJWTAcessToken } from "../../../middlewares/auth.js";
import { apiLimiter } from "../../../middlewares/rateLimiter.js";




const router = express.Router()


router.post('/create', apiLimiter, productValidation, validateJWTAcessToken, requireSuperUser, createProduct )

















export { router as productRoutes}