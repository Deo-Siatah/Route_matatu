// gamificationRepository.js
async function upsertRoutePoints(client, phoneNumber, pointsToAdd) {
    // UPSERT logic: If the phone number exists, add points. If not, insert a new row.
    const query = `
        INSERT INTO route_points (phone_number, points_balance)
        VALUES ($1, $2)
        ON CONFLICT (phone_number) 
        DO UPDATE SET points_balance = route_points.points_balance + $2
        RETURNING points_balance;
    `;
    const result = await client.query(query, [phoneNumber, pointsToAdd]);
    return result.rows[0].points_balance;
}

module.exports = { upsertRoutePoints };