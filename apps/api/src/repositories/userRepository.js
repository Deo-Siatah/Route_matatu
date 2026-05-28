// userRepository.js
const db = require('../db');

async function createUser(saccoId, email, passwordHash, role) {
    const query = `
        INSERT INTO users (sacco_id, email, password_hash, role) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, sacco_id, email, role;
    `;
    const result = await db.query(query, [saccoId, email, passwordHash, role]);
    return result.rows[0];
}

async function getUserByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
}

module.exports = { createUser, getUserByEmail };