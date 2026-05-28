const express = require('express');
const cors = require('cors');
const { handleUssdRequest } = require('./controllers/ussdController');

const app = express();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true })); // parses the x-www-form-urlencoded data from AT
app.use(express.json());

// Routes
app.post('/ussd', handleUssdRequest);

// Health check endpoint
app.get('/', (req, res) => res.send('RouteReady API is running.'));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});