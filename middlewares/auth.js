import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

const validateJWTAcessToken = (req, res, next) =>{
    
    const accessToken = req.cookies.admin_token || req.cookies.customer_token
   
    if(!accessToken) return res.status(401).json({message: 'No token provided'})
    try{
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET, 
            {
                'algorithms' : [`HS256`]
            })
        // admin info
        req.adminId = decoded.adminId || null;
        req.adminUsername = decoded.adminUsername || null;
        req.isAdmin = decoded.isAdmin || null;
        req.role = decoded.role || null;
                
         //customer info
        req.customerId = decoded.customerId || null;
        req.customerUsername = decoded.customerUsername || null;
        req.isCustomer = decoded.isCustomer || null;
        
        if(!req.adminId  && !req.customerId ){ return res.status(403).json(
            {message: 'Access denied'}
        )}        
        next()

    }catch(err){
        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({message:'Access token expired'})
        } return res.status(401).json({message:' Invalid token'})
    }
   
}


const validateJWTRefreshToken = (req, res, next)=>{
    const refreshToken = req.cookies.refresh_admin_token || req.cookies.refresh_customer_token
    if(!refreshToken) return res.status(401).json({
        message: 'No refresh token found'})
    try{
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,{
            algorithms: ['HS256']
        })

        if(decoded.adminId) {
            req.adminId = decoded.adminId
        } 
        else if (decoded.customerId){
            req.customerId = decoded.customerId
        }
        if(!req.adminId  && !req.customerId ){ return res.status(403).json(
        {message: 'Access denied'}
        )}
    next()  
    }catch(err){
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

}

const requireSuperUser = (req, res, next)=>{
    if (req.role !== process.env.SUPER_USER){
        return res.status(403).json({message: 'Strictly for super users'})
    }
    next()
}

const customerOnly = (req, res, next)=>{
    if (!req.customerId && !req.isCustomer) {
        return res.status(403).json({message:" Sorry! Strictly for customers"})
    }
    next()
}


export {

    requireSuperUser, validateJWTAcessToken, 
    validateJWTRefreshToken, customerOnly
}

/*
    WORKING
try{
        const adminToken = req.cookies.admin_token 
        const customerToken = req.cookies.customer_token;
        
        let decoded;
        if(adminToken){
            try{
                decoded = jwt.verify(adminToken, process.env.JWT_SECRET, {
                'algorithms' : [`HS256`]
                })
                //admin info
                req.adminId = decoded.adminId || null;
                req.adminUsername = decoded.adminUsername || null;
                req.isAdmin = decoded.isAdmin || null;
                req.role = decoded.role || null;
            }catch(err){
                console.warn("Bad token: ", err)
            } 
        }
        if (customerToken){
            try{
                decoded = jwt.verify(customerToken, process.env.JWT_SECRET, {
                'algorithms' : [`HS256`]
                })
                //customer info
                req.customerId = decoded.customerId || null;
                req.customerUsername = decoded.customerUsername || null;
                req.isCustomer = decoded.isCustomer || null;
            }catch(err){
                console.warn("Bad token: ", err)
            }   
        }
        
        if(!req.adminId  && !req.customerId ){
            return res.status(403).json(
                {message: 'Access denied'})
        }
    }catch(err){
        console.log('Error validating token: ', err)
        return res.status(500).json({
            message : "Failed JWT validation",
            error : err.stack
        })
    }
    next()
}



*/

































