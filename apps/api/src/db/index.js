const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon requires SSL
    ssl: { rejectUnauthorized: false } 
});

module.exports = {
    // Standard query for single actions
    query: (text, params) => pool.query(text, params),
    // Expose the pool so we can grab a dedicated client for Transactions
    getPool: () => pool 
};