import  dotenv  from 'dotenv';
import db from '../../config/database.js';
import positiveIntParam from '../../../utils/paramInput.js'

dotenv.config()

const generateOrderItems = async (req, res)=>{
    try{
        const customerId = req.customerId

        const {productName, quantity, unitPrice} = req.body

        const queryProduct = await db.query(`
            SELECT * FROM products WHERE product_name =$1`,
            [productName])
        if(queryProduct.rows.length === 0){
            return res.status(400).json({message: 'Invalid product'})
        }
       
        //extract productId, stockQuantity. and unitPrice 
        const productId = queryProduct.rows[0].product_id
       
        const stockQuantity = queryProduct.rows[0].stock_quantity
        
        const productPrice = queryProduct.rows[0].price
        console.log("productNames in productsDB: ", productPrice)
        
        if(quantity > stockQuantity){
            return res.status(400).json(
                {message: `${productName} is cuurently out of stock`})
        }
        
        if(unitPrice < productPrice || unitPrice > productPrice ){
            return res.status(400).json({
                message : `${productName} is sold for ${productPrice}`
            })
        }
        //extract orderId
        const myOrder = await db.query(`
            SELECT order_id FROM orders WHERE customer_id = $1
            `, [customerId])
        if(myOrder.rows.length === 0){
            return res.status(400).json({
                message: "You haven't placed any order"
            })
        }
        const orderId = myOrder.rows[0].order_id;

        //No duplicate order_items
        const existingOrderItems = await db.query(`
            SELECT * 
                FROM order_items
                WHERE product_id = $1
                    AND order_id = $2 
                    AND quantity = $3 
                    AND unit_price = $4
            `, [productId, orderId, quantity, unitPrice])
        if(existingOrderItems.rows.length === 1){
            return res.status(400).json({
                message: 'Order items already generated'
            })
        }
        const createOrderItem = await db.query(`
            INSERT INTO order_items 
                (order_id, product_id, quantity, unit_price)
            VALUES($1, $2, $3, $4)
            RETURNING order_item_id;`
            ,[orderId, productId, quantity, unitPrice])
        // extract createdOrderItems data
        const orderItems = createOrderItem.rows[0]
        
        // for socketIO to update product quantity
        const OrderItemsData = {
            orderItemsId : orderItems.order_items_id,
            productId : orderItems.product_id,
            orderId : orderItems.order_id,
            quantity : orderItems.quantity
        }
        console.log("orderItemsData: ", OrderItemsData)
    
         
        return res.status(201).json({
            message:'Order items created successfully'})
    }catch(err){
        console.log('Failed creating order items: ', err)
        return res.status(500).json({
            message: 'Error creating order items',
            error : err.stack
        })
    }
}
const myOrderItems = async (req, res)=>{
    const customerId = req.customerId
    const customerUsername = req.customerUsername
    const isCustomer = await db.query(`
        SELECT email FROM customers WHERE username = $1`, [customerUsername])
    if(isCustomer.rows.length === 0) return res.status(401).json({
        message : "You're not authorized"
    })
    try{    
        const placedOrder = await db.query(`
            SELECT order_id FROM orders WHERE customer_id = $1`, [customerId])
        if(placedOrder.rows.length === 0){
            return res.status(404).json({message: "No record. Please kindly please order"})
        }
        const order = placedOrder.rows[0].order_id
        const myItems = await db.query(`
            SELECT
                c.username AS username, order_id, 
                pr.product_name AS products, quantity, unit_price, amount
            FROM order_items
            JOIN products pr USING (product_id)
			JOIN orders o USING (order_id)
            JOIN customers c USING (customer_id)
			WHERE order_id = $1
			ORDER BY order_id DESC
        `, [order])
        return res.status(200).json(myItems.rows)
    }catch(err){
        console.log("Error fetching order items for customer", err)
        return res.status(500).json({
            message: "Failed retrieving customer's order items",
            error : err.stack
        })
    }

}

const viewOrderItems = async (req, res) =>{
    const { order_id } = req.params
    const role = req.role
    if(role !== process.env.SUPER_USER) return res.status(401).json({
        message : "Only for super users"
    })
    try{
        if(order_id){
            try{
                let orderId
                orderId = positiveIntParam(order_id)
                const getOrderItem = await db.query(`
                    SELECT
                        order_item_id, c.username AS username, order_id, 
                        pr.product_name AS products, quantity, unit_price, amount
                    FROM order_items
                    JOIN products pr USING (product_id)
                    JOIN orders o USING (order_id)
                    JOIN customers c USING (customer_id)
                    WHERE order_id = $1
                    ORDER BY order_id DESC
                    `, [orderId])
                if(getOrderItem.rows.length === 0){
                    return res.status(200).json({
                        message: "No order items record for this customer"})
                }return res.status(200).json(getOrderItem.rows)
            }catch(err){
                console.log("Expected integer param: ",err)
                return res.status(400).json({message: err.message})
            }
        }else{
            const getAllOrderItems = await db.query(`
                SELECT
                    order_item_id, c.username AS username, order_id, 
                    pr.product_name AS products, quantity, unit_price, amount
                FROM order_items
                JOIN products pr USING (product_id)
                JOIN orders o USING (order_id)
                JOIN customers c USING (customer_id)
                ORDER BY order_id DESC
                `)
            return res.status(200).json(getAllOrderItems.rows)
        }
    }catch(err){
        console.log("Error in fetching ordered items: ", err)
        return res.status(500).json({
            message : "Error occurred getting ordered items",
            error : err.stack
        })
    }

}



export {generateOrderItems, myOrderItems, viewOrderItems}





























