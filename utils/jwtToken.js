import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const generateToken = {
    accessToken : function(payload){
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {'expiresIn' : '5m'}
        )
        return token
    },

    refreshToken : function(userId){
        const newToken = jwt.sign(
            userId,
            process.env.REFRESH_TOKEN_SECRET,
            {'expiresIn' : '24h'}
        )
        return newToken
    }

}

export {generateToken}