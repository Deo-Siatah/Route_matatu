require('dotenv').config();
const credentials = {
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
};

// Initialize the SDK
const Africastalking = require('africastalking')(credentials);

// Export the specific services we need
module.exports = {
    sms: Africastalking.SMS,
    ussd: Africastalking.USSD // (Optional, we mostly handle USSD via Express routes)
};