const db = require('../config/database');

class Order {
    static async create({ userId, items, totalAmount, status = 'pending' }) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            // Create order
            const orderQuery = `
                INSERT INTO orders (user_id, total_amount, status)
                VALUES ($1, $2, $3)
                RETURNING *`;
            const orderResult = await client.query(orderQuery, [userId, totalAmount, status]);
            const order = orderResult.rows[0];

            // Create order items
            for (const item of items) {
                const itemQuery = `
                    INSERT INTO order_items (order_id, product_id, quantity, price)
                    VALUES ($1, $2, $3, $4)`;
                await client.query(itemQuery, [order.id, item.productId, item.quantity, item.price]);

                // Update product stock
                const updateStockQuery = `
                    UPDATE products 
                    SET stock = stock - $1 
                    WHERE id = $2 AND stock >= $1`;
                const updateResult = await client.query(updateStockQuery, [item.quantity, item.productId]);
                
                if (updateResult.rowCount === 0) {
                    throw new Error('Insufficient stock');
                }
            }

            await client.query('COMMIT');
            return order;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async findByUserId(userId) {
        const query = `
            SELECT o.*, json_agg(
                json_build_object(
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price', oi.price
                )
            ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
            GROUP BY o.id`;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    static async updateStatus(orderId, status) {
        const query = `
            UPDATE orders 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *`;
        const result = await db.query(query, [status, orderId]);
        return result.rows[0];
    }
}

module.exports = Order;