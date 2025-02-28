const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create({ email, password, name }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (email, password, name)
            VALUES ($1, $2, $3)
            RETURNING id, email, name`;
        const result = await db.query(query, [email, hashedPassword, name]);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}