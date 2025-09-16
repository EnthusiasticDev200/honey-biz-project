import express from "express";
import {customerOnly, validateJWTAcessToken } from '../../../middlewares/auth.js'
import createReview from "../../controllers/authControllers/reviewControllers.js";

const router = express.Router()


router.post('/create', validateJWTAcessToken, customerOnly, createReview )











export {router as reviewRoutes}















