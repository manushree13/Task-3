const db = require('../config/database');

class Product {
    static async create({ name, description, price, stock }) {
        const query = `
            INSERT INTO products (name, description, price, stock)
            VALUES ($1, $2, $3, $4)
            RETURNING *`;
        const result = await db.query(query, [name, description, price, stock]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM products WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findAll() {
        const query = 'SELECT * FROM products';
        const result = await db.query(query);
        return result.rows;
    }

    static async update(id, updates) {
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setString = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        
        const query = `
            UPDATE products 
            SET ${setString}
            WHERE id = $${keys.length + 1}
            RETURNING *`;
        
        const result = await db.query(query, [...values, id]);
        return result.rows[0];
    }

    static async delete(id) {
        const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}