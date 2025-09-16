import * as z from 'zod';

//later on let paymentStatus be btw socketIO and DB
const paymentMethodValue = (str)=>{
  return str === 'credit card' || str === 'wired transfer' 
  ? str 
  : new Error("credit card or wired transfer expected") 
}

const paymentStatusValue = (str)=>{
  return str === 'pending' || str === 'confirmed' 
  ? str 
  : new Error("pending or confirmed expected")
}


// Admin validation
const adminRegSchema = z.object({
  firstName: z.string()
    .nonempty('Field cannot be empty')
    .toLowerCase(),

  lastName: z.string()
    .nonempty('Field cannot be empty')
    .toLowerCase(),

  username: z.string()
    .min(5, "Must be at least five characters")
    .toLowerCase(),

  email: z.string().email("Invalid email address"),

  phoneNumber: z.string()
    .regex(/^\d{10,15}$/, "Phone number must contain only numbers (10-15 digits)"),

  password: z.string()
    .min(7, "Password must be at least 7 characters")
    .max(15, "Password cannot exceed 15 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one symbol"),

  role: z.string()
    .nonempty('Field cannot be empty')
    .toLowerCase(),
});

const updatePasswordSchema = z.object({
  email: z.string().email("Invalid email address").nonempty(),
  newPassword: z.string()
    .nonempty()
    .min(7, "Password must be at least 7 characters")
    .max(15, "Password cannot exceed 15 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one symbol"),
})

// const updateProfileSchema = z.object({
//   newPhoneNumber: z.string()
//     .regex(/^\d{10,15}$/, "Phone number must contain only numbers (10-15 digits)"),
//   newEmail: z.string().email("Invalid email address")
// })

// Customer
const customerRegSchema = z.object({
  firstName: z.string()
    .nonempty('Field cannot be empty')
    .toLowerCase(),

  lastName: z.string()
    .nonempty('Field cannot be empty')
    .toLowerCase(),

  username: z.string()
    .nonempty('Field cannot be empty')
    .toLowerCase(),

  email: z.string().email("Invalid email address"),

  phoneNumber: z.string()
    .regex(/^\d{10,15}$/, "Phone number must contain only numbers (10-15 digits)"),

  password: z.string()
    .min(7, "Password must be at least 7 characters")
    .max(15, "Password cannot exceed 15 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one symbol")
})

// Product validation
const productSchema = z.object({
  productName: z.string()
    .min(10, "Name must be at least 10 characters")
    .toLowerCase(),

  stockQuantity: z.number()
    .int("Stock quantity must be an integer")
    .min(1, "Stock must be greater than zero")
    .max(1000, "Stock cannot exceed 1000"), // you can adjust this limit

  price: z.number()
    .int("Price must be an integer")
    .min(1, "Price must be greater than zero")
    .max(100000, "Price cannot exceed 100000"), // adjust as needed
});

const otpSchema = z.object({
  email: z.string().email("Invalid email address").nonempty()
})

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address").nonempty(),
  inputOTP: z.string()
    .nonempty()
    .min(6, "OTP digits didn't meet min criteria")
    .min(6, "OTP digits didn't meet max criteria")
    .regex(/^\d{6}$/, "OTP not recognized")
})
// Order creation validation
// const orderSchema = z.object({
//   paymentMethod : z.string()
//   .nonempty()
//   .transform((val)=>{
//     const result = paymentMethodValue(val)
//     if(result instanceof Error) throw result // throws input error
//     return result.toLowerCase()

//   }),
// })

const validate = schema => (req, res, next)=>{
  try{
    const result = schema.safeParse(req.body)
    
    if(!result.success) {
      return res.status(400).json({
        message:'Validation error', 
        error: z.prettifyError(result.error)}) // human-readable
    }
    req.body = result.data // pass sanitized data to req.body
  
  }catch(err){
    console.log("Error in validate schema: ", err)
    return res.status(500).json({
      message : 'validation unsuccessful',
      error : err.stack
    })
  }
  next();
}

//admin
export const registerAdminValidation = validate(adminRegSchema)

//customer
export const registerCustomerValidation = validate(customerRegSchema)

export const updatePasswordValidation = validate(updatePasswordSchema)
//export const updateProfileValidation = validate(updateProfileSchema)

export const otpValidation = validate(otpSchema)
export const verifyOtpValidation = validate(verifyOtpSchema)
export const productValidation = validate(productSchema)
//export const createOrderValidation = validate(orderSchema)