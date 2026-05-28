const routeRepo = require('../repositories/routeRepository');
const trafficService = require('../services/trafficService');

async function handleUssdRequest(req, res) {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;
    
    // Split the input into an array to determine the user's step
    const textArray = text === '' ? [] : text.split('*');
    const level = textArray.length;

    let responseText = '';

    try {
        // --- LEVEL 0: MAIN MENU ---
        if (level === 0) {
            responseText = `CON Welcome to RouteReady\n1. Check Route Status\n2. Report Delay`;
        }

        // --- OPTION 1: CHECK ROUTE FLOW ---
        else if (textArray[0] === '1') {
            if (level === 1) {
                const routes = await routeRepo.getAllRoutes();
                responseText = 'CON Select Route:\n';
                routes.forEach(r => { responseText += `${r.id}. ${r.name}\n`; });
            } 
            else if (level === 2) {
                const routeId = parseInt(textArray[1]);
                const status = await routeRepo.getRecentRouteStatus(routeId);

                if (status) {
                    responseText = `END Status: ${status.status_type}\nReport: ${status.custom_message}\nTime: ${new Date(status.created_at).toLocaleTimeString()}`;
                } else {
                    responseText = `END Route is currently clear. No recent delays reported.`;
                }
            }
        }

        // --- OPTION 2: REPORT DELAY FLOW ---
        else if (textArray[0] === '2') {
            if (level === 1) {
                const routes = await routeRepo.getAllRoutes();
                responseText = 'CON Which route has a delay?\n';
                routes.forEach(r => { responseText += `${r.id}. ${r.name}\n`; });
            }
            else if (level === 2) {
                responseText = `CON What is the status?\n1. Heavy Traffic\n2. Accident/Stalled Vehicle`;
            }
            else if (level === 3) {
                responseText = `CON Briefly type the location/details:`;
            }
            else if (level === 4) {
                const routeId = parseInt(textArray[1]);
                const statusType = textArray[2] === '1' ? 'Heavy Traffic' : 'Accident';
                const customMessage = textArray[3]; // The text they just typed

                // Trigger our massive Transaction Service
                const result = await trafficService.submitReportAndAwardPoints(
                    routeId, phoneNumber, statusType, customMessage
                );

                responseText = `END Thank you! Report logged.\nYou now have ${result.newBalance} Route Points.`;
            }
        }
        else {
            responseText = "END Invalid Input.";
        }

    } catch (error) {
        console.error("USSD Logic Error:", error);
        responseText = "END System error. Please try again later.";
    }

    // CRITICAL: Respond to Africa's Talking in plain text
    res.set('Content-Type', 'text/plain');
    res.send(responseText);
}

module.exports = { handleUssdRequest };