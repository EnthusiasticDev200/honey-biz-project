import express from "express";
import { createProduct } from "../../controllers/authControllers/productControllers.js";
import { productValidation } from "../../../middlewares/validation.js";
import { requireSuperUser } from "../../../middlewares/auth.js";
import { validateJWTAcessToken } from "../../../middlewares/auth.js";

const router = express.Router()


router.post('/create',productValidation, validateJWTAcessToken, requireSuperUser, createProduct )

















export { router as productRoutes}