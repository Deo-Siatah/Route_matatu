const db = require('../db/index.js');

/**
 * Grabs all phone numbers subscribed to a specific route for the SMS blast.
 */
async function getSubscribersByRoute(routeId) {
    const query = 'SELECT phone_number FROM subscribers WHERE route_id = $1';
    const result = await db.query(query, [routeId]);
    return result.rows.map(row => row.phone_number); // Returns an array of phone numbers
}

module.exports = { getSubscribersByRoute };