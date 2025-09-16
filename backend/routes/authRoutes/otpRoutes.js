import express  from "express";
import { sendOtp, verifyOtp } from "../../controllers/authControllers/otpController.js";
import { otpValidation, verifyOtpValidation } from "../../../middlewares/validation.js";
const router = express.Router()



router.post('/send', otpValidation,sendOtp)

router.post('/verify', verifyOtpValidation,verifyOtp)


export {router as otpRoutes} 