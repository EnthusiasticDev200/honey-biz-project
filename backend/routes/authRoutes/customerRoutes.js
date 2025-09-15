import express from "express";
import {
    loginCustomer, logoutCustomer, registerCustomer, refreshCustomerToken,
    viewCustomers,
    changeCustomerPassword,
    updateCustomerProfile
        } 
    from '../../controllers/authControllers/customerControllers.js'
import { validateJWTAcessToken, validateJWTRefreshToken,requireSuperUser, customerOnly } from "../../../middlewares/auth.js";
import { registerCustomerValidation, updatePasswordValidation, updateProfileValidation } from "../../../middlewares/validation.js";

const router = express.Router()

router.post('/create', registerCustomerValidation,registerCustomer)
router.post('/login', loginCustomer)
router.post('/refresh', validateJWTRefreshToken, refreshCustomerToken)

router.get('/logout', validateJWTAcessToken, logoutCustomer)
router.get(["/view", "/view/:customer_id"], validateJWTAcessToken, requireSuperUser, viewCustomers) 

router.patch('/password/update', updatePasswordValidation, changeCustomerPassword)

router.patch('/profile/update', updateProfileValidation, updateCustomerProfile)




export {router as customerRoutes}











