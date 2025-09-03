import db from "../../config/database.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../../../utils/jwtToken.js";
import redis from "../../config/redis.js";

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
      return res.status(403).json({
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
    const { email, password } = req.body;
    
    const checkAdmin = await db.query(
      `SELECT * FROM admins WHERE email = $1`,
      [email]
    );
    if (checkAdmin.rows.length === 0){
      return res.status(400).json({ message: "Not an admin" });
    } 
    // capture admin
    const admin = checkAdmin.rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch){
      return res.status(403).json({
        message: "Oops! wrong password",
      });
    }
    const adminPayload = 
      {
        adminId : admin.admin_id,
        adminUsername : admin.username,
        isAdmin : admin.is_admin,
        isCustomer : false,
        role : admin.role
      }
    console.log('admin:payload ', adminPayload)
    
    const refreshTokenPayload = { adminId : admin.admin_id}

    const accessToken = generateToken.accessToken(adminPayload)
    console.log('admin_token: ',accessToken)

    const refreshToken = generateToken.refreshToken(refreshTokenPayload)
    console.log('refreshAdminToken: ', refreshToken)

    // Store admin info in Redis
    await redis.set(
      `admin : ${refreshTokenPayload}`,
      JSON.stringify(adminPayload),
      "EX",
      7 * 24 * 60 * 60 // 7days
    )
  
    res.clearCookie('admin_token')
    //Send token to cookie
    res.cookie('admin_token', accessToken,  // Same token but as adminToken in cookie
      {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",  
        sameSite: "strict",  
        path: "/",         
        maxAge: 5 * 60 * 1000 //5mins
      })
    res.cookie('refresh_admin_token', refreshToken, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",  
        sameSite: "strict",  
        path: "/",         
        maxAge: 24 * 60 * 60 * 1000 // 24hrs
    })
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
  console.log('adminId from refreshAdminToken: ', {adminId})
  try{
    let adminPayload;
    //check redis data
    const cacheData = await redis.get(`admin: ${adminId}`)
    console.log('admin cacheData: ', cacheData)
    
    if(cacheData){
      console.log('show admin cache: ', cacheData)
      adminPayload = JSON.parse(cacheData)
    }
    //query DB if redis miss
    const queryAdmin = await db.query(`
      SELECT 
            admin_id, username, role, is_admin
      FROM admins
      WHERE admin_id = $1`, [adminId])
    
    const admin = queryAdmin.rows[0]
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    
    adminPayload = {
      adminId : admin.admin_id,
      adminUsername : admin.username,
      isAdmin : admin.is_admin,
      isCustomer : false,
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
    console.log('admin new Acees token: ', newAceesToken)

    //replace old to new acces token
    res.cookie('admin_token', newAceesToken, {
      httpOnly : true,
      secure : process.env.NODE_ENV === 'production',
      sameSite : "strict",
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
      if(!adminUsername) return res.status(403).json({
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



export { 
  registerAdmin, loginAdmin, logoutAdmin, 
  refreshAdminToken 
};
