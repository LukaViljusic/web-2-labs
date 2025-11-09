import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool ({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: false
});

export async function getUsers(username: string, isChecked: boolean) {
    try {
        if(!isChecked) {
            const result = await pool.query(`SELECT * FROM users WHERE username = '${username}'`);

            return result.rows;
        } else {
            const result = await pool.query(
                `SELECT * FROM users WHERE username = $1`,
                [username]
            );
            return result.rows;
        }
        
    } catch(err) {
        throw err;
    }
}

export async function login(username: string, password: string) {
    try {
        const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [username]);
        
        return result.rows[0] || null;
    } catch(err) {
        throw err;
    }
}

export async function attempsRemaining(id: number, attempsRemaining: number) {
    try {
        const result = await pool.query(`UPDATE users SET attempsRemaining = $1 WHERE id = $2 RETURNING *`, [attempsRemaining, id]);

        return result.rows[0] || null;
    } catch(err) {
        throw err;
    }
}