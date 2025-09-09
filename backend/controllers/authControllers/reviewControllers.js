import db from "../../config/database.js"



const createReview = async (req,res)=>{
    const customerId = req.customerId
    const { email, feedback, rating} = req.body
    try{
        const idCustomer = await db.query(`
            SELECT customer_id, first_name, last_name, email  
                FROM customers
            WHERE email = $1
                AND customer_id =  $2
            `, [email, customerId])
        if(idCustomer.rows.length === 0){
            return res.status(400).json({
                message : 'Impersonation not allowed'
            })
        }
        const checkReview = await db.query(`
            SELECT * FROM reviews WHERE customer_id = $1`,
            [customerId])
        if(checkReview.rows.length > 0) return res.status(409).json({
            message : "Review already created"
        })
        await db.query(`
            INSERT INTO reviews (customer_id, feedback, rating)
            VALUES ($1, $2, $3)`, [customerId, feedback, rating])
        return res.status(201).json({message: "Review successfully created"})
    }catch(err){
        console.log("Error occurred creating review: ", err)
        return res.status(500).json({
            message: "Creating reviews failed",
            error : err.stack
        })
    }
}


export default createReview






























