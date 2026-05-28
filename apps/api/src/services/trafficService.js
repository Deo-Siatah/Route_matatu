const { getPool } = require('../db');
const reportRepo = require('../repositories/reportRepository');
const subscriberRepo = require('../repositories/subscriberRepository');
// const logger = require('logger'); // Assuming you set up Winston

/**
 * Handles the logic when a user submits a delay via USSD.
 * Uses a SQL Transaction to ensure data integrity.
 */
async function handleNewTrafficReport(routeId, phoneNumber, statusType, customMessage) {
    const pool = getPool();
    const client = await pool.connect(); // Grab a dedicated connection

    try {
        // BEGIN TRANSACTION: If any query fails after this, none of it saves.
        await client.query('BEGIN');

        // 1. Save the report and award the gamification points
        const reportId = await reportRepo.createReportAndAwardPoints(
            client, routeId, phoneNumber, statusType, customMessage
        );

        // COMMIT TRANSACTION: Everything succeeded, save to database permanently.
        await client.query('COMMIT');
        // logger.info(`Report ${reportId} saved. Points awarded to ${phoneNumber}.`);

        // 2. Trigger the SMS Alert (BACKGROUND PROCESS)
        // We do this AFTER the commit so users only get SMS for successful reports.
        await triggerSmsAlerts(routeId, statusType, customMessage);

        return true;

    } catch (error) {
        // ROLLBACK: Something broke! Undo the report insert and undo the points.
        await client.query('ROLLBACK');
        console.error("Transaction failed, rolled back:", error);
        throw error; // Let the Controller handle telling the user there was an error
    } finally {
        client.release(); // Always return the connection to the pool
    }
}

/**
 * Fetches subscribers and uses Africa's Talking SDK to send an SMS
 */
async function triggerSmsAlerts(routeId, statusType, customMessage) {
    try {
        const phoneNumbers = await subscriberRepo.getSubscribersByRoute(routeId);
        
        if (phoneNumbers.length === 0) return; // No one to alert

        const message = `RouteReady Alert: ${statusType} reported on Route ${routeId}. Details: ${customMessage}`;

        // TODO: Initialize Africa's Talking SDK and call sms.send() here
        console.log(`[MOCK SMS] Sending to ${phoneNumbers.length} users: ${message}`);

    } catch (error) {
        console.error("Failed to send SMS alerts:", error);
    }
}

module.exports = { handleNewTrafficReport };