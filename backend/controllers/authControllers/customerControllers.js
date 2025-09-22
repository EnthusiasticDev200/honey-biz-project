import db from "../../config/database.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../../../utils/jwtToken.js";
import redis from "../../config/redis.js";
import positiveIntParam from "../../../utils/paramInput.js";


//register customer
const registerCustomer = async (req, res) => {
  try {
    const { firstName, lastName, username, email, phoneNumber, password } =
      req.body;
    const existingCustomer = await db.query(
      `SELECT email FROM customers WHERE email = $1`,
      [email]
    );
    if (existingCustomer.rows.length > 0)
      return res.status(409).json({
        message: "Customer already exist",
      });

    const passwordHash = await bcrypt.hash(password, 10);
    await db.query(
      `
        INSERT INTO customers(
            first_name, last_name, username, email, phone_number, 
            password_hash)
        VALUES ($1, $2, $3, $4, $5, $6)`,
      [firstName, lastName, username, email, phoneNumber, passwordHash]
    );
    return res.status(201).json({ message: "Customer succesfuly created" });
  } catch (err) {
    console.log("Error registering customer: ", err);
    return res.status(500).json({
      message: "Error registering customer",
      error: err.stack,
    });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    const queryCustomer = await db.query(`
      SELECT customer_id, username, password_hash FROM customers WHERE email = $1`,
      [email]
    );
    if (queryCustomer.rows.length === 0) {
      return res.status(401).json({ message: "Not an customer" })
      };
    // capture the customer
    const customer = queryCustomer.rows[0]

    const passwordMatch = await bcrypt.compare(
      password,
      customer.password_hash
    );
    if (!passwordMatch) return res.status(401).json({message: 'Invalid password'});
    // jwt set-up
    const customerPayload = 
      {
        customerId : customer.customer_id,
        customerUsername : customer.username,
      }
    // uniform name with validateRefreshToken middleware
    const refreshTokenPayload = { customerId : customer.customer_id }

    // store customer info in redis
    await redis.set(
      `customer: ${ refreshTokenPayload }`,
      JSON.stringify(customerPayload),
      "EX",
      7 * 24 * 60 * 60
    )
    //generate token
    const accessToken = generateToken.accessToken(customerPayload)
  
    const refreshToken = generateToken.refreshToken(refreshTokenPayload)

    // clear previous cookie and set new one
    res.clearCookie('customer_token')
    res.cookie('customer_token', accessToken, 
      {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",  
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",  
        path: "/",         
        maxAge: 5 * 60 * 1000 // 5mins
      })

    //refresh token in cookie
    res.cookie('refresh_customer_token', refreshToken, 
      {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",  
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",  
        path: "/",         
        maxAge: 24 * 60 * 60 * 1000 //24hrs 
      })
    return res.status(200).json(
      { message: `Welcome ${customer.username}` });
  } catch (err) {
    console.log("Login failed: ", err);
    return res.status(500).json({
      message: "Error loggin in",
      error: err.stack,
    });
  }
};

const refreshCustomerToken = async (req, res)=>{
  const customerId = req.customerId

  if(!customerId) return res.status(401).json({message: `You're not a customer`})
  
  try{
    let customerPayload;
    //check customer info in redis
    const cacheData = await redis.get(`customer: ${customerId}`)
    
    if(cacheData) {
      customerPayload = JSON.parse(cacheData)
    } 
    // Else, on redis miss, query DB
    const queryCustomer = await db.query(`
      SELECT 
            customer_id, username
      FROM customers
      WHERE customer_id = $1
      `, [customerId])
    
    const customer = queryCustomer.rows[0]
    if(!customer) return res.status(404).json({
      message : "Customer not found"
    })
    //generate new payload
    customerPayload = {
      customerId : customer.customer_id,
      customerUsername : customer.username
    }
    //update redis
    await redis.set(
      `customer: ${customerPayload.customerId}`,
      JSON.stringify(customerPayload),
      "EX", 
      7 * 24 * 60 * 60
    )
    const customerNewToken = generateToken.accessToken(customerPayload)
    
    //replace old to new access token
    res.cookie('customer_token', customerNewToken, {
      httpOnly : true,
      secure : process.env.NODE_ENV === 'production',
      sameSite : process.env.NODE_ENV === 'production' ? "None" : "Lax",
      path : '/',
      maxAge : 5 * 60 * 1000
    })
    return res.status(201).json({
      message: "Successfully created new acess token"
    })
  }catch(err){
    console.log('Error creating new token :', err)
    return res.status(500).json({
      message:'Failed creating new token',
      error : err.stack
    })
  }
}

const logoutCustomer = (req, res)=>{
  try{
    const customerUsername = req.customerUsername
    if(!customerUsername) {
      return res.status(403).json({
      message : 'Intruder'
    })}
    res.clearCookie('customer_token')
    res.clearCookie('refresh_customer_token')
    return res.status(200).json({message : ` Bye ${customerUsername}`})
  }catch(err){
    console.log("Customer logout failed: ", err);
    return res.status(500).json({
      message: "Error logging customer out ",
      error: err.stack,
    });
  }
}

const viewCustomers = async (req, res) => {
  try {
    const {customer_id } = req.params
    if(customer_id){
      let id;
      try{
        id = positiveIntParam(customer_id )
        const getOneCustomer = await db.query(`
          SELECT 
                customer_id, first_name, last_name, username,
                email, phone_number, created_at
          FROM customers
          WHERE customer_id = $1`, [id])
        if(getOneCustomer.rows.length === 0){
          return res.status(404).json({
            message : 'Customer not found'
          })
        } return res.status(200).send(getCustomer.rows[0])
      }catch(err){
        return res.status(401).json({ message : err.message})
      }
    }else{
      const getAllCustomers = await db.query(`
      SELECT 
            customer_id, first_name, last_name, username,
            email, phone_number, created_at
      FROM customers`);
      return res.status(200).send(getAllCustomers.rows);
    }

  } catch (err) {
    console.log("Error fecthing customers: ", err);
    return res.status(500).json({
      message: "Can't get customers",
      error: err.stack});
    }
  };

  const changeCustomerPassword = async (req, res)=>{
      const { email, newPassword } = req.body
      
      try{
          const checkCustomer = await db.query(`
            SELECT email, customer_id
            FROM customers
            WHERE email = $1
            `, [email])
          if(checkCustomer.rows.length === 0){
            return res.status(404).json({
              message: 'Not a customer'})
          }
          const customerId = checkCustomer.rows[0].customer_id

          const cachedOTP = await redis.get(`otp:${email}`)
          if(!cachedOTP || cachedOTP === null) return res.status(401).json({
            message : "OTP verification needed"
          })
          
          const otp = JSON.parse(cachedOTP)
          
          // ensure OTP email matches email
          if(otp.email !== email) return res.status(401).json({
              message : "OTP email mismatches with yours"
            })
          if(!otp.verified) return res.status(401).json({
            message : "OTP not yet verified"
          })
          const salt = await bcrypt.genSalt(10)
          const hashedPassword = await bcrypt.hash(newPassword, salt)
          //update password
          await db.query(`
            UPDATE customers
            SET password_hash = $1
            WHERE customer_id = $2`, [hashedPassword, customerId])

          await redis.del(`otp:${email}`)
          return res.status(200).json({message: "Password successfully upated"})
      }catch(err){
          console.log("Error occurred updating password", err)
          return res.status(500).json({
            message : "Updating password failed",
            error : err.stack
          })
      }
  }

const updateCustomerProfile = async(req,res)=>{
    const customerId = req.customerId
    
    const { newPhoneNumber, newEmail } = req.body
    
    let customerProfile
    try{
        const cacheData = await redis.get(`customer: ${customerId}`)
        //on redis get
        if(cacheData){
          customerProfile = JSON.parse(cacheData)
        }
        //on redis misss
        const checkCustomer = await db.query(`
            SELECT 
                  customer_id, username
            FROM customers
            WHERE customer_id = $1`, [customerId])
        
        if(checkCustomer.rows.length === 0) return res.status(404).json({
              message : "Customer details not found"
        })
        const customer = checkCustomer.rows[0]
        const customerData = {
          customerId : customer.customer_id,
          username : customer.username
        }
        const updateCustomerProfile = await db.query(`
            SELECT 
                  email, phone_number 
            FROM customers
            WHERE customer_id = $1   
            AND email = $2
            AND phone_number = $3
            `, [customerId, newEmail, newPhoneNumber])
        if(updateCustomerProfile.rows.length > 0) return res.status(409).json({
          message : " Data already updated"
        })
        await db.query(`
              UPDATE customers
                  SET email = $1,
                      phone_number = $2
              WHERE customer_id = $3`, [newEmail, newPhoneNumber, customerId])
        // update redis
        await redis.set(`
          customer: ${customerData.customerId}`,
          JSON.stringify({
            username : customerData.username
          })
        )
        return res.status(200).json({message: 'Customer data succesfully updated'})

    }catch(err){
        console.log("Error occurred updating customer profile: ", err)
        return res.status(500).json({
          message : "Encountered error updating customer profile",
          error : err.stack
        })
      }
}

export { 
  registerCustomer, viewCustomers, loginCustomer, updateCustomerProfile,
  refreshCustomerToken,logoutCustomer, changeCustomerPassword
  };
