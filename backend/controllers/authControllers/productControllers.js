import db from "../../config/database.js";
import dotenv from 'dotenv'

dotenv.config



const createProduct = async (req, res) =>{
    try{
        const {productName, stockQuantity,price} = req.body
        const existingProduct = await db.query(`
            SELECT * FROM products WHERE product_name = $1`, [productName])
        if(existingProduct.rows.length > 0){
            return res.status(400).json(
                {message: 'Product already exist'})
        }
        await db.query(`
           INSERT INTO products(
                product_name, stock_quantity, price) 
           VALUES ($1, $2, $3)`, [productName, stockQuantity, price])
            return res.status(201).json({
                message: 'Product created successfully'
            })
    }catch(err){
        console.log('Error creating product: ', err)
        return res.status(500).json({
            message : 'Error creating product',
            error : err.stack
        })
    }
}

export {createProduct}