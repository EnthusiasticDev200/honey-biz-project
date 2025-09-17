import express  from "express";
import { sendOtp, verifyOtp } from "../../controllers/authControllers/otpController.js";
import { otpValidation, verifyOtpValidation } from "../../../middlewares/validation.js";
import { authLimiter } from "../../../middlewares/rateLimiter.js";





const router = express.Router()



router.post('/send', authLimiter, otpValidation,sendOtp)

router.post('/verify', authLimiter, verifyOtpValidation,verifyOtp)


export {router as otpRoutes} 