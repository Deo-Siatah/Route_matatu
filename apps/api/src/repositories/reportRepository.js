/**
 * Note: Instead of using the default pool, this function accepts a 'client' 
 * so it can run inside a Service-level Transaction.
 */
async function createReportAndAwardPoints(client, routeId, phoneNumber, statusType, customMessage) {
    // 1. Insert the actual traffic report
    const insertReportQuery = `
        INSERT INTO reports (route_id, phone_number, status_type, custom_message) 
        VALUES ($1, $2, $3, $4)
        RETURNING id;
    `;
    const reportResult = await client.query(insertReportQuery, [routeId, phoneNumber, statusType, customMessage]);

    // 2. Give the user 10 points (UPSERT: Insert if new, Update if exists)
    const updatePointsQuery = `
        INSERT INTO route_points (phone_number, points_balance)
        VALUES ($1, 10)
        ON CONFLICT (phone_number) 
        DO UPDATE SET points_balance = route_points.points_balance + 10;
    `;
    await client.query(updatePointsQuery, [phoneNumber]);

    return reportResult.rows[0].id;
}

module.exports = { createReportAndAwardPoints };