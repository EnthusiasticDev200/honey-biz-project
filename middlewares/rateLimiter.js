import rateLimit from "express-rate-limit";


const authLimiter = rateLimit({
    windowMs : 15 * 60 * 1000,
    max : 5,   // 5 req, per 15min
    message : {
        error : "Too many attempts. Try again in 15 minutes."
    },
    standardHeaders : true,
    legacyHeaders : false
})

const apiLimiter = rateLimit({
    windowMs : 15 * 60 * 1000,
    max : (req, res)=>{
            if (req.adminId) return  300; // if admin, use 300
            if (req.customerId) return 200
            return 100; //if guest 
    }, 
    message : {
        error : "Rate limit exceeded. Try again later."
    },
    keyGenerator: (req)=> {
        if (req.adminId) return `admin:${req.adminId}`;
        if (req.customerId) return `customer:${req.customerId}`;
        return `guest:${req.ip}`;
    },
    standardHeaders : true,
    legacyHeaders : false
})

const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, //very strict to prevent fraud payment
    message: { error: "Too many payment attempts. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.customerId || req.ip,
});




export {authLimiter, apiLimiter, paymentLimiter}




