import redis from "../../config/redis.js";
import db from '../../config/database.js'
import sendOtpEmail from '../../../utils/mailer.js'
import generateOTP from '../../../utils/otp.js'


const sendOtp = async (req, res)=>{
    const {email} = req.body
    console.log("email: ", email)
    try{
        //remember to add zod verification
        const [checkAdminEmail, checkCustomerEmail] = await Promise.all([
            db.query(`SELECT email FROM admins WHERE email = $1`, [email]),
            db.query(`SELECT email FROM customers WHERE email = $1`, [email])
        ])
        
        const adminEmail = checkAdminEmail.rows.length > 0 ? checkAdminEmail.rows[0] : null;
        const customerEmail = checkCustomerEmail.rows.length > 0 ? checkCustomerEmail.rows[0] : null
        
        if(!adminEmail && !customerEmail) return res.status(401).json({message : "Unrecognized email"})
        
        const otp = generateOTP() 
        const payloadOTP = {
            email : email,
            otp : otp
        }
        await redis.set(`otp:${email}`,
            JSON.stringify(payloadOTP),
            'EX',
            5 * 60
        )
        await sendOtpEmail(email, otp)
        return res.status(200).json({Message: 'OTP sent to your email'})
    }catch(err){
        console.log("Error sending OTP: ", err)
        return res.status(500).json({
            message : "Sending OTP Failed",
            error : err.stack
        })
    } 

}


const verifyOtp = async(req, res)=>{
    const { email, inputOTP } = req.body

    try{
        const storedOTPInfo = await redis.get(`otp:${email}`)

        if(!storedOTPInfo) return res.status(401).json({
            message : "Either OTP is expired or not found"
        })
        const dataOTP = JSON.parse(storedOTPInfo)
        
        if(dataOTP.email !== email) return res.status(401).json({
            message : 'Email mismatch'
        })
       
        if(dataOTP.otp !== inputOTP) return res.status(401).json({
            message : "Invalid or Expired OTP"
        })
        //delete after use
        //await redis.del(`otp: ${email}`)
        return res.status(200).json({message: 'OTP verified successfully'})
    }catch(err){
        console.log('Error verifying OTP: ', err)
        return res.status(500).json({
            message : 'OTP verification failed',
            error : err.stack
        })
    }
}



export { sendOtp, verifyOtp}
