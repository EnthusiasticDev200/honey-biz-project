import db from '../../config/database.js';
import { identifyCustomer } from './orderControllers.js';



const generateOrderItems = async (req, res)=>{
    try{
        const getCustomerId = identifyCustomer(req)
        const customerId = getCustomerId[0]

        // remove amount from req.body and from db too. autocreate it
        // unit price should be from products 
        const {productName, quantity, unitPrice, amount} = req.body

        const queryProduct = await db.query(`
            SELECT * FROM products WHERE product_name =$1`
            [productName])
        if(queryProduct.rows.length === 0){
            return res.status(400).json({message: 'Invalid product'})
        }
        //extract productId, and stockQuantity. unitPrice later
        const productId = queryProduct.rows[0].product_id
        // const unitPrice = queryProduct.rows[0].unit_price
        const stockQuantity = queryProduct.rows[0].stock_quantity

        if(quantity > stockQuantity){
            return res.status(400).json(
                {message: `${productName} is cuurently out stock`})
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
            WHERE product_id, order_id, quantity, unit_price, amount
            `, [productId, orderId, quantity, unitPrice, amount])
        if(existingOrderItems.rows.length === 1){
            return res.status(400).json({
                message: 'Order items already generated'
            })
        }
        const createOrderItem = await db.query(`
            INSERT INTO order_items 
                (product_id, order_id, quantity, unit_price, amount)
            VALUES($1, $2, $3, $4, $5)`
            ,[productId, orderId, quantity, unitPrice, amount])
        // extract createdOrderItems data
        const orderItems = createOrderItem.rows[0]
        
        // for socketIO to update product quantity
        const OrderItemsData = {
            orderItemsId : orderItems.order_items_id,
            productId : orderItems.product_id,
            orderId : orderItems.order_id,
            quantity : orderItems.quantity
        }
        // add socketIO func here to update db
         
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



export {generateOrderItems}





























