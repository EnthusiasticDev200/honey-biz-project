import express from "express";
import {customerOnly, validateJWTAcessToken } from '../../../middlewares/auth.js'
import createReview from "../../controllers/authControllers/reviewControllers.js";
import { apiLimiter } from "../../../middlewares/rateLimiter.js";




const router = express.Router()


router.post('/create', apiLimiter,validateJWTAcessToken, customerOnly, createReview )











export {router as reviewRoutes}















