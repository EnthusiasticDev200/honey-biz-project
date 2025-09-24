import db from "../../config/database.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../../../utils/jwtToken.js";
import redis from "../../config/redis.js";
import {performance} from 'perf_hooks'

//register admin
const registerAdmin = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      phoneNumber,
      password,
      role,
    } = req.body;
    const existingAdmin = await db.query(
      `SELECT email FROM admins WHERE email = $1`,
      [email]
    );
    if (existingAdmin.rows.length > 0)
      return res.status(409).json({
        message: "Admin already exist",
      });

    const passwordHash = await bcrypt.hash(password, 10);
    await db.query(
      `
        INSERT INTO admins(
            first_name, last_name, username, email, phone_number, 
            password_hash, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [firstName, lastName, username, email, phoneNumber, passwordHash, role]
    );
    return res.status(201).json({ message: "Admin succesfuly created" });
  } catch (err) {
    console.log("Error registering admin: ", err);
    return res.status(500).json({
      message: "Error registering admin",
      error: err.stack,
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const apiStart = performance.now()
    console.log("api start at:", apiStart + 'ms')
    const { email, password } = req.body;
    
    const queryStart = performance.now()
    const checkAdmin = await db.query(
      `SELECT admin_id, username, password_hash, role
         FROM admins 
        WHERE email = $1`,
        [email]
    );
    const queryend = performance.now()
    console.log("total query executionTime:", queryend-queryStart + 'ms')
    if (checkAdmin.rows.length === 0){
      return res.status(401).json({ message: "Not an admin" });
    } 
    // capture admin
    const admin = checkAdmin.rows[0];   

    const hashStart = performance.now() 
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    const hashEnd = performance.now()
    console.log("Total hashing time took: ", hashEnd-hashStart + 'ms')
    if (!passwordMatch){
      return res.status(401).json({
        message: "Oops! wrong password",
      });
    }
    const adminPayload = 
      {
        adminId : admin.admin_id,
        adminUsername : admin.username,
        role : admin.role
      }

    const refreshTokenPayload = { adminId : admin.admin_id}

    const accessToken = generateToken.accessToken(adminPayload)
  
    const refreshToken = generateToken.refreshToken(refreshTokenPayload)
    
    // Store admin info in Redis
    const redisStart = performance.now()
    await redis.set(
      `admin : ${refreshTokenPayload}`,
      JSON.stringify(adminPayload),
      "EX",
      7 * 24 * 60 * 60 // 7days
    )
    const redisEnd = performance.now()
    console.log("Total time spent on Redis:", redisEnd-redisStart + 'ms')
    
    res.clearCookie('admin_token')
    //Send token to cookie
    res.cookie('admin_token', accessToken,
      {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",  
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",  
        path: "/",         
        maxAge: 5 * 60 * 1000 //5mins
      })
    res.cookie('refresh_admin_token', refreshToken, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",  
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",  
        path: "/",         
        maxAge: 24 * 60 * 60 * 1000 // 24hrs
    })

    const apiEnd = performance.now()
    console.log("API spent total of:", apiEnd-apiStart + 'ms')

    return res.status(200).json({ message: `Welcome ${admin.username}` });
  
  } catch (err) {
    console.log("Login failed: ", err);
    return res.status(500).json({
      message: "Error loggin in",
      error: err.stack,
    });
  }
};

// refresh token logic
const refreshAdminToken = async (req, res) =>{
  const adminId = req.adminId 
  if(!adminId) return res.status(401).json({message: 'Unauthorized'})
  
  try{
    let adminPayload;
    //check redis data
    const cacheData = await redis.get(`admin: ${adminId}`)
   
    
    if(cacheData){
      console.log('show admin cache: ', cacheData)
      adminPayload = JSON.parse(cacheData)
    }
    //query DB if redis miss
    const queryAdmin = await db.query(`
      SELECT 
            admin_id, username, role
      FROM admins
      WHERE admin_id = $1`, [adminId])
    
    const admin = queryAdmin.rows[0]
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    
    adminPayload = {
      adminId : admin.admin_id,
      adminUsername : admin.username,
      role : admin.role
    }
    // Update redis with new data
    await redis.set(
      `admin: ${adminPayload.adminId}`,
      JSON.stringify(adminPayload),
      'EX',
      7 * 24 * 60 * 60 //7days
    )
    const newAceesToken = generateToken.accessToken(adminPayload)
    //replace old to new acces token
    res.cookie('admin_token', newAceesToken, {
      httpOnly : true,
      secure : process.env.NODE_ENV === 'production',
      sameSite : process.env.NODE_ENV === 'production' ? "None" : "Lax",
      path : '/' ,
      maxAge : 10 * 60 *1000
    })
    return res.status(201).json(
      {message:"New access token successfully created "})
  }catch(err){
        console.log("Error creating refresh token: ", err)
        return res.status(500).json({
          message : 'Failure creating refresh token',
          error : err.stack
        })
  }
}

const logoutAdmin = (req, res)=>{
  try{
      const adminUsername = req.adminUsername
      if(!adminUsername) return res.status(401).json({
        message: 'Not permitted'})
      res.clearCookie('admin_token')
      res.clearCookie('refresh_admin_token')
      return res.status(200).json({message : `Bye ${adminUsername}`})
  }catch(err){
      console.log("Failed logging admin out: ", err)
      return res.status(500).json({
        message : 'Error logging out admin',
        error : err.stack
      })
  }
}

const updateAdminProfile = async(req,res)=>{
    const adminId = req.adminId
    const { newPhoneNumber, newEmail} = req.body

    let adminProfile
    try{
        const cacheData = await redis.get(`admin: ${adminId}`)
        //on redis get
        if(cacheData){
          adminProfile = JSON.parse(cacheData)
        }
        //on redis misss
        const checkAdmin = await db.query(`
            SELECT 
                  admin_id, username
            FROM admins
            WHERE admin_id = $1`, [adminId])
        if(checkAdmin.rows.length === 0) return res.status(404).json({
          message : "Admin details not found"
        })
        const admin = checkAdmin.rows[0]
        const adminData = {
          adminId : admin.admin_id,
          username : admin.username
        }
        const updateAdminProfile = await db.query(`
            SELECT 
                  email, phone_number 
            FROM admins
            WHERE admin_id = $1   
            AND email = $2 
            `, [adminId, newEmail])
        if(updateAdminProfile.rows.length > 0) return res.status(409).json({
          message : " Data already updated"
        })
        await db.query(`
              UPDATE admins
                  SET email = $1, 
                      phone_number = $2
              WHERE admin_id = $3`, [newEmail, newPhoneNumber, adminId])
        // update redis
        await redis.set(`
          admin: ${adminData.adminId}`,
          JSON.stringify({
            username : adminData.username
          })
        )
        return res.status(200).json({message: 'Admin data succesfully updated'})

    }catch(err){
        console.log("Error occurred updating admin profile: ", err)
        return res.status(500).json({
          message : "Encountered error updating admin profile",
          error : err.stack
        })
      }
}


//change admin password
const changeAdminPassword = async (req, res) =>{
  const {email, newPassword} = req.body
  
  try{
    const checkAdmin = await db.query(`
      SELECT admin_id, password_hash, email FROM admins WHERE email = $1`, [email])
    if(checkAdmin.rows.length === 0) return res.status(401).json({
      message : "Not an admin"
    })
    const adminId = checkAdmin.rows[0].admin_id
    
    //check redis
    const cachedOTP = await redis.get(`otp:${email}`)
    
    if(!cachedOTP || cachedOTP === null){
      return res.status(400).json({
        message: "OTP verification needed"})
    }
    const otpData = JSON.parse(cachedOTP)
    if(otpData.email !== email){
      return res.status(401).json({message:"Email mismatch"})
    }
    if(!otpData.verified) return res.status(401).json({
      message : "OTP not yet verified"
    })
    //create new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword,salt)
    //update DB
    await db.query(`
        UPDATE admins
        SET password_hash = $1
        WHERE admin_id = $2`, [hashedPassword, adminId])
    //delete OTP from Redis
    await redis.del(`otp:${email}`)
    return res.status(200).json({message: "Password successfully updated"})
  }catch(err){
    console.log("Error updating admin password: ", err)
    return res.status(500).json({
      message: "Updating admin password failed",
      error : err.stack
    })
  }
}


export { 
  registerAdmin, loginAdmin, logoutAdmin, 
  refreshAdminToken, updateAdminProfile, changeAdminPassword
};
