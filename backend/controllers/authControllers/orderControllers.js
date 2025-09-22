import dotenv from 'dotenv'
import db from '../../config/database.js'
import paystack from '../../config/paystack.js'
import positiveIntParam from '../../../utils/paramInput.js'
import crypto from 'crypto'
import discount from '../../../utils/discountFunction.js'

dotenv.config()

const createOrder = async (req, res) =>{
    try{
        const customerId = req.customerId

        const verifyCustomer = await db.query(`
            SELECT email FROM customers WHERE customer_id = $1`,
        [customerId])
        if(verifyCustomer.rows.length === 0){
            return res.status(403).json({message: 'Gotcha! Not a customer'})
        }
        
        // Clear pending orders first
        const pendingingOrder = await db.query(`
            SELECT customer_id, payment_status 
                FROM orders 
            WHERE customer_id = $1
                AND payment_status = 'pending'
         `, [customerId])
         if(pendingingOrder.rows.length === 1){
             return res.status(409).json({
                message : 'Please, clear your pending order'
             })
        }
        
       const generateOrder = await db.query(`
            INSERT INTO orders (customer_id) 
            VALUES ($1)
            RETURNING order_id;
        `, [customerId])

        // const generatedOrderData = {
        //     orderId : generateOrder.rows[0].order_id,
        //     customerId : generateOrder.rows[0].customer_id,
        //     methodOfPayment : generateOrder.rows[0].payment_method,
        //     statusPayment : generateOrder.rows[0].payment_status
        // }
        return res.status(201).json({message: 'Order successfully created'})  
    }catch(err){
        console.log("Error creating order: ", err)
        return res.status(500).json({
            message : "Failed creating order",
            error : err.stack
        })
    }
}


const viewOrders = async (req, res) =>{
    const { order_id } = req.params
    const { customer_id } = req.params
   
    try{
        if(order_id){
            let orderId; 
            try{
                orderId = positiveIntParam(order_id)
                const getOneOrder = await db.query(`
                    SELECT 
                        c.customer_id, c.username AS username, o.order_id, 
                        SUM(quantity) AS total_quantity, SUM (amount) AS total_bill, 
                        payment_method, payment_status, o.created_at
                    FROM orders o
                    JOIN customers c USING (customer_id)
                    JOIN order_items oi USING (order_id)
                    GROUP BY c.customer_id, c.username, order_id, payment_method, payment_status, o.created_at
                    HAVING order_id = $1
                    ORDER BY created_at DESC;
                    `, [orderId])
                
                if(getOneOrder.rows.length === 0){
                    return res.status(404).json({message:'No order record found'})
                } return res.status(200).json(getOneOrder.rows[0])
            }catch(err){
                return res.status(400).json({message: err.message})
            }
        } 
        else if(customer_id){
            let customerId;
            try{
                customerId = positiveIntParam(customer_id)
                const getCustomerOrder = await db.query(`
                     SELECT 
                        c.customer_id, c.username AS username, o.order_id, 
                        SUM(quantity) AS total_quantity, SUM (amount) AS total_bill, 
                        payment_method, payment_status, o.created_at
                    FROM orders o
                    JOIN customers c USING (customer_id)
                    JOIN order_items oi USING (order_id)
                    GROUP BY c.customer_id, c.username, order_id, payment_method, payment_status, o.created_at
                    HAVING customer_id = $1
                    ORDER BY created_at DESC;  
                    `, [customerId])
                if(getCustomerOrder.rows.length === 0){
                    return res.status(404).json({message: 'No order(s) for customer'})
                } return res.status(200).json(getCustomerOrder.rows)
            }catch(err){
                return res.status(400).json({message: err.message})
            }
        } else{
            const getAllOrders = await db.query(`
                SELECT 
                    c.customer_id, c.username AS username, o.order_id, 
                    SUM(quantity) AS total_quantity, SUM (amount) AS total_bill, 
                    payment_method, payment_status, o.created_at
                FROM orders o
                JOIN customers c USING (customer_id)
                JOIN order_items oi USING (order_id)
                GROUP BY c.customer_id, c.username, order_id, payment_method, payment_status, o.created_at
                ORDER BY created_at DESC;
            `)
            const orders = getAllOrders.rows
            return res.status(200).json([orders])
        }
    }catch(err){
        console.log('Error fetching orders: ', err)
        return res.status(500).json({
            message : 'Failed fetching orders',
            error : err.stack
        })
    }
}

//works fine. Don't touch
const customerOrder = async (req, res)=>{
    try{
        const username = req.customerUsername
        
        const order = await db.query(`
        SELECT 
	        c.customer_id, c.username AS username, o.order_id, 
	        SUM(quantity) AS total_quantity, SUM (amount) AS total_bill, 
	        payment_method, payment_status, o.created_at
        FROM orders o
        JOIN customers c USING (customer_id)
        JOIN order_items oi USING (order_id)
        GROUP BY c.customer_id, c.username, order_id, payment_method, payment_status, o.created_at
        HAVING c.username = $1
        ORDER BY created_at DESC;  
        `, [username])

        const myOrder = order.rows
        if(myOrder.length === 0){
            return res.status(204).json({message: 'You have no order'})
        }
        return res.status(200).json([myOrder])
    }catch(err){
        console.log("Failed fetching customer order: ", err)
        return res.status(500).json({
            message: 'Error fetchinng customer order',
            error : err.stack
        })
    }
}

const orderCheckOut = async (req, res) =>{
    const { email } = req.body
    const { order_id } = req.params
    const username = req.customerUsername
    try{
        const verifyCustomerEmail = await db.query(`
            SELECT email FROM customers WHERE email = $1`, [email])
        if(verifyCustomerEmail.rows.length === 0) return res.status(404).json({
            message : 'Unrecognized email'
        })
        try{
            const orderId = positiveIntParam(order_id)
            // Protect customer's order
            const checkOrder = await db.query(`
                SELECT 
                    order_id, username, payment_status
                FROM orders
                JOIN customers USING (customer_id)
                WHERE order_id = $1
                    AND username = $2`, [orderId, username])

            if(checkOrder.rows.length === 0) return res.status(404).json({
                message : "Order not created with your details"
            })
            const order = checkOrder.rows[0]

            if(order.payment_status !== 'pending') return res.status(400).json({
                message : ' Order has already been processed'
            })
            //extract amount from order_items table
            const totalAmount = await db.query(`
                SELECT 
                        SUM(amount) AS total_amount
                FROM order_items
                WHERE order_id = $1
                GROUP BY order_id`, [orderId])
            
            if (totalAmount.rows.length === 0) {
                return res.status(400).json({ message: "No items found for this order" });
            }
            const amount = totalAmount.rows[0].total_amount
            const discountPrice = discount(amount)
            const reference = `ORDER_${orderId}_${Date.now()}`
            //Initialize Paystack transaction
            const response = await paystack.post("/transaction/initialize", {
                email, 
                amount: discountPrice * 100, // Paystack uses kobo (multiply by 100)
                reference: reference,
                callback_url: `${process.env.BASE_URL}/api/auth/orders/${orderId}/verify?reference=${reference}}`,
            });
            return res.status(200).json({
                authorization_url: response.data.data.authorization_url,
                reference: response.data.data.reference,
            });
         }catch(err){
                console.log("Input param not a number: ", err)
                return res.status(400).json({error: err.message})
            }
    }catch(err){
        console.log('Order checkout operation failed: ', err)
        return res.status(500).json({
            message : "Error occurred processiong order checkout",
            error : err.stack
        })
    }
}

const verifyPayment = async (req, res) =>{
    const { order_id } = req.params
    //const { reference } = req.query  <- uncomment when using frontend
    const reference =  "ORDER_6_1758298166836"
    try{
        if(!reference) return res.status(400).json({
            message : "No payment reference found" })

        try{
            const orderId = positiveIntParam(order_id)
            // Check if payment has already been verified
            const checkOrder = await db.query(`
                SELECT payment_status, total_amount 
                    FROM orders 
                WHERE order_id = $1`, [orderId])
            
            const clearedOrder = checkOrder.rows[0]
            if( clearedOrder.payment_status == 'confirmed' 
                && clearedOrder.total_amount !== '')
            return res.status(409).json({
                message: 'Order payment already verified'})
            // verify transaction from paystack
            const response = await paystack.get(`/transaction/verify/${reference}`)
            const paymentData = response.data.data
           
            if(paymentData.status === 'success'){
            //update order's table
            await db.query(`
                UPDATE orders
                    SET payment_method = $1,
                        total_amount = $2,
                        payment_status = $3,
                        updated_at = NOW()
                WHERE order_id = $4`, 
                [paymentData.channel, paymentData.amount / 100, 
                    "confirmed", orderId])
            return res.status(200).json({
                    message : "Payment was successful",
                    payment : paymentData })}
            else{
                return res.status(400).json({message:"Unsuccessful payment"})}
            }catch(err){
                console.log("Invalid input param: ", err)
                return res.status(400).json({
                    error : err.message
                })
            }
    }catch(err){
        console.log("Error verifying payment: ", err)
        return res.status(500).json({
            message : "Payment verification failed",
            error : err.stack
        })
    }
}

const paystackWebhook = async (req, res) =>{
    const secret = process.env.PAYSTACK_SECRET_KEY
    try{
        // handling raw body
        const rawBody = req.body.toString()
        // verify paystack header
        const hash = crypto
                    .createHmac('sha512', secret)
                    .update(rawBody)
                    .digest('hex')
        const paystackSignature = req.headers["x-paystack-signature"]
    
        if(hash !== paystackSignature){
            return res.status(401).json({message: 'Invalid signature'})
        }
        //parse raw body once
        const event = JSON.parse(rawBody)
        if(event.event === "charge.success"){ //check event under transaction on webhook doc
            const payment = event.data
            const reference = payment.reference
            const orderId = reference.split("_")[1] // removes timestamp for ORDER_{orderId}
            
            try{
                await db.query(`
                UPDATE orders
                    SET payment_method = $1,
                        total_amount = $2,
                        payment_status = $3,
                        updated_at = NOW()
                    WHERE order_id = $4`, 
                        [payment.channel, payment.amount / 100, 
                            "confirmed", orderId])
                console.log(`Order ${orderId} updated successfully via webhook`);
            }catch(dbErr){
                console.log("Db update failed: ", dbErr)
                return res.status(500).json({
                    message : "Updating DB failed",
                    error : dbErr.stack
                })
            }
        }
        //200 res MUST be sent to Paystack when using webhook
       return res.status(200).json({ message: "Webhook processed" });
    }catch(err){
        console.log("Error implementing Webhook: ", err)
        return res.status(500).json({
            message: "Webhook implementation failed",
            error : err.stack
        })
    } 
}











export {
    createOrder, viewOrders, customerOrder,
    orderCheckOut, verifyPayment, paystackWebhook
    
    }

