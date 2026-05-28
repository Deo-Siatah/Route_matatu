// trafficService.js
const { getPool } = require('../db');
const gamificationRepo = require('../repositories/gamificationRepository');

// Assuming you have a reportRepository with an insertReport function
// that accepts (client, routeId, phoneNumber, statusType, customMessage)

async function submitReportAndAwardPoints(routeId, phoneNumber, statusType, customMessage) {
    const pool = getPool();
    const client = await pool.connect(); // Grab a dedicated connection for the transaction

    try {
        // 1. BEGIN the transaction
        await client.query('BEGIN');

        // 2. Insert the traffic report (Passing the transaction client)
        const insertReportQuery = `
            INSERT INTO reports (route_id, phone_number, status_type, custom_message) 
            VALUES ($1, $2, $3, $4) RETURNING id;
        `;
        const reportResult = await client.query(insertReportQuery, [
            routeId, phoneNumber, statusType, customMessage
        ]);
        const reportId = reportResult.rows[0].id;

        // 3. Award 10 points to the user for contributing (Passing the same client)
        const POINTS_REWARD = 10;
        const newBalance = await gamificationRepo.upsertRoutePoints(client, phoneNumber, POINTS_REWARD);

        // 4. COMMIT: Everything was successful. Save both queries to the database permanently.
        await client.query('COMMIT');
        
        console.log(`Success: Report ${reportId} logged. ${phoneNumber} now has ${newBalance} points.`);
        return { success: true, reportId, newBalance };

    } catch (error) {
        // 5. ROLLBACK: If EITHER the report insert OR the points insert fails, 
        // cancel the entire operation so we don't have corrupted data.
        await client.query('ROLLBACK');
        console.error("Transaction failed! Rolled back to prevent data corruption:", error);
        throw new Error("Failed to process report and points.");
    } finally {
        // 6. Release the client back to the pool so the server doesn't crash from memory leaks
        client.release();
    }
}

module.exports = { submitReportAndAwardPoints };