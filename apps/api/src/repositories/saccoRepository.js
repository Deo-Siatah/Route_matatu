// saccoRepository.js
// const db = require('../../../../packages/db');
const db = require('../db/index.js');

async function createSacco(name, contactEmail) {
    const query = `
        INSERT INTO saccos (name, contact_email) 
        VALUES ($1, $2) 
        RETURNING id, name;
    `;
    const result = await db.query(query, [name, contactEmail]);
    return result.rows[0];
}

async function getSaccoById(id) {
    const result = await db.query('SELECT * FROM saccos WHERE id = $1', [id]);
    return result.rows[0];
}

module.exports = { createSacco, getSaccoById };