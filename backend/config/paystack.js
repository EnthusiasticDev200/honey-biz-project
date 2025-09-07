import dotenv from "dotenv"
import axios from "axios";


dotenv.config()


const paystack = axios.create({
    baseURL: "https://api.paystack.co",
    headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
})



export default paystack





