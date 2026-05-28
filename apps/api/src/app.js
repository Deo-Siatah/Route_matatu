const express = require('express');
const cors = require('cors');
const { handleUssdRequest } = require('./controllers/ussdController');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true })); // parses the x-www-form-urlencoded data from AT
app.use(express.json());
// THE FIX: Bulletproof path routing
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.post('/ussd', handleUssdRequest);

app.get('/api/live-dashboard', async (req, res) => {
    const { query } = require('./db/index.js');
    try {
        // --- DATA-DECAY & SELF-HEALING SQL ENGINE ---
        // 1. It filters out any reports older than 45 minutes (Data-Decay).
        // 2. It grabs only the absolute latest report per route using DISTINCT ON.
        // 3. If a route has no recent reports, it automatically falls back to 'Clear' (Self-Healing).
        const sql = `
            WITH DecayedReports AS (
                SELECT DISTINCT ON (route_id) 
                    route_id, 
                    status_type, 
                    custom_message, 
                    phone_number, 
                    created_at
                FROM reports
                WHERE created_at >= NOW() - INTERVAL '45 minutes'
                ORDER BY route_id, created_at DESC
            )
            SELECT 
                r.id as route_id,
                r.name as route_name,
                COALESCE(d.status_type, 'Clear') as status_type,
                COALESCE(d.custom_message, 'Traffic is flowing normally. Have a safe trip!') as custom_message,
                COALESCE(d.phone_number, 'System Engine') as phone_number,
                COALESCE(d.created_at, NOW()) as created_at
            FROM routes r
            LEFT JOIN DecayedReports d ON r.id = d.route_id
            ORDER BY r.id ASC;
        `;
        
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error("Algorithm Error:", err);
        res.status(500).json({ error: "Algorithmic calculation failed" });
    }
});


// --- NEW: API to fetch all active routes from the DB ---
app.get('/api/routes', async (req, res) => {
    const routeRepo = require('./repositories/routeRepository');
    try {
        const routes = await routeRepo.getAllRoutes();
        res.json(routes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch routes" });
    }
});

// --- NEW: Dashboard API to Submit Reports ---
// app.post('/api/reports', async (req, res) => {
//     const { routeId, phoneNumber, statusType, customMessage } = req.body;
//     try {
//         const trafficService = require('./services/trafficService');
        
//         // This is the EXACT same function the USSD uses!
//         // It saves to the DB, gives points, AND triggers the AT SMS Alert automatically.
//         const result = await trafficService.submitReportAndAwardPoints(
//             routeId, phoneNumber, statusType, customMessage
//         );
        
//         res.json({ success: true, message: "Dispatch report broadcasted successfully!" });
//     } catch (err) {
//         console.error("Dashboard Report Error:", err);
//         res.status(500).json({ error: "Failed to broadcast report" });
//     }
// });

app.post('/api/reports', async (req, res) => {
    const { routeId, phoneNumber, statusType, customMessage } = req.body;
    const { query } = require('./db/index.js'); // Assuming this is your DB instance
    
    try {
        const trafficService = require('./services/trafficService');
        
        // 1. Save the dispatch report to the database
        await trafficService.submitReportAndAwardPoints(
            routeId, phoneNumber, statusType, customMessage
        );
        
        // 2. Fetch Premium Subscribers for this specific route
        // (Modify the table/column names if your schema is different)
        const sql = `SELECT phone_number FROM subscribers WHERE route_id = $1`;
        const result = await query(sql, [routeId]);
        
        // Extract the numbers into an array (e.g., ['+254711223344', '+254799887766'])
        const premiumNumbers = result.rows.map(row => row.phone_number);

        // 3. Trigger the SMS via Africa's Talking Legacy Sandbox API
        // Trigger the SMS via Africa's Talking Legacy Sandbox API
if (premiumNumbers.length > 0) {
    const AfricasTalking = require('africastalking')({
        apiKey: process.env.AT_API_KEY, // Your Sandbox API Key
        username: 'sandbox'             // MUST be 'sandbox'
    });

    const sms = AfricasTalking.SMS;
    const alertText = `RouteReady Alert: ${statusType} reported on your route. ${customMessage}`;

    // The SDK strictly validates these keys. Do NOT pass bulkSMSMode here!
    await sms.send({
        to: premiumNumbers, 
        message: alertText,
        from: 'AFTKNG' 
    });

    console.log(`[PROACTIVE SMS SUCCESS] Alert sent to ${premiumNumbers.length} premium subscribers.`);
} else {
    console.log(`[SMS SKIPPED] No premium subscribers found for route ${routeId}.`);
}
        
        res.json({ success: true, message: "Dispatch report saved and SMS broadcasted successfully!" });
        
    } catch (err) {
        console.error("Dashboard Report & SMS Error:", err);
        res.status(500).json({ error: "Failed to broadcast report and SMS" });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});