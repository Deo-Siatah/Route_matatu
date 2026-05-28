const db = require('../db');

/**
 * Fetches all available routes for the main menu.
 */
async function getAllRoutes() {
    const result = await db.query('SELECT id, name FROM routes ORDER BY id ASC');
    return result.rows;
}

/**
 * Fetches a route's status by JOINING the routes table with the reports table.
 * It only looks at reports from the last 2 hours.
 */
async function getRecentRouteStatus(routeId) {
    const query = `
        SELECT 
            r.name as route_name, 
            rep.status_type, 
            rep.custom_message, 
            rep.created_at
        FROM routes r
        -- JOIN allows us to get the route name and the report data in one query
        LEFT JOIN reports rep ON r.id = rep.route_id
        WHERE r.id = $1 AND rep.created_at >= NOW() - INTERVAL '2 hours'
        ORDER BY rep.created_at DESC
        LIMIT 1; -- We just want the most recent report for the MVP
    `;
    const result = await db.query(query, [routeId]);
    return result.rows[0]; // Returns undefined if no recent reports exist
}

module.exports = { getAllRoutes, getRecentRouteStatus };