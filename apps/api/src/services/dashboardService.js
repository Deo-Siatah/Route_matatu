// dashboardService.js
const bcrypt = require('bcryptjs');
const saccoRepo = require('../repositories/saccoRepository');
const userRepo = require('../repositories/userRepository');

async function registerSaccoAndAdmin(saccoName, email, plainTextPassword) {
    // 1. Create the SACCO first
    const sacco = await saccoRepo.createSacco(saccoName, email);

    // 2. Hash the admin's password (Cost factor of 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainTextPassword, salt);

    // 3. Create the Admin User linked to the new SACCO
    const user = await userRepo.createUser(sacco.id, email, passwordHash, 'admin');

    return { sacco, user };
}

module.exports = { registerSaccoAndAdmin };