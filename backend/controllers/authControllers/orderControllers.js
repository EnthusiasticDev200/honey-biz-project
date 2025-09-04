import db from '../../config/database.js'

import positiveIntParam from '../../../utils/paramInput.js'

const identifyCustomer = req =>{
    const myId = req.customerId
    const myUsername = req.customerUsername
    if(!myId && !myUsername){
        return new Error("Not a customer")
    } return [myId, myUsername]
}



const createOrder = async (req, res) =>{
    try{
        const ifCustomer = identifyCustomer(req)
        const customerId = ifCustomer[0]

        const verifyCustomer = await db.query(`
            SELECT email FROM custoers WHERE customer_id = $1`,
        [customerId])
        if(verifyCustomer.rows.length === 0){
            return res.status(403).json({message: 'Gotcha! Not a customer'})
        }
        console.log('customerId from Order: ', customerId)
        const {paymentMethod, paymentStatus} = req.body

        const existingStatus = 'pending'
        // Clear pending orders first
        const pendingingOrder = await db.query(`
            SELECT * FROM orders 
            WHERE customer_id = $1
            AND payment_status = $2
         `, [customerId, existingStatus])
         if(pendingingOrder.rows.length === 1){
             return res.status(400).json({
                message : 'Please, clear your pending order'
             })
        }

        //No duplicate order
        const placedOrder = await db.query(`
            SELECT * 
                FROM orders
            WHERE customer_id = $1 
                AND payment_method = $2
                AND payment_status = $3  
            `, [customerId, paymentMethod, paymentStatus])
        if(placedOrder.rows.length > 1){
            return res.status(400).json({message: 'Order already exist'})
        }
        
       /*2. If not duplicate, ensure stock quantiy in 
       product > order_items quantity 
          else 
          return no available at the moment
        */
       const generateOrder = await db.query(`
            INSERT INTO orders (customer_id, payment_method, payment_status)
            VALUES ($1, $2, $3)
            RETURNING order_id;
        `, [customerId, paymentMethod, paymentStatus])

        const generatedOrderData = {
            orderId : generateOrder.rows[0].order_id,
            customerId : generateOrder.rows[0].customer_id,
            methodOfPayment : generateOrder.rows[0].payment_method,
            statusPayment : generateOrder.rows[0].payment_status
        }
        return res.status(201).json({message: 'Order successfully created'})  
    }catch(err){
        console.log("Error creating order: ", err)
        return res.status(500).json({
            message : "Failed creating order",
            error : err.stack
        })
    }
}

//Good. Do not touch
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
                return res.status(401).json({message: err.message})
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
                return res.status(401).json({message: err.message})
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
        const ifCustomer = identifyCustomer(req)
        const username = ifCustomer[1]
        
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
            return res.status(200).json({message: 'You have no order'})
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


export {identifyCustomer,createOrder, viewOrders, customerOrder}