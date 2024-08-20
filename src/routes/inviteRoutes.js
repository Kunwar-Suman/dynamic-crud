const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const transporter = require('../middleware/mailConfig');
const UserDetails = require('../models/userDetails');

// Function to generate a unique token
const generateInvitationToken = () => crypto.randomBytes(20).toString('hex');

// Function to create an expiration date for the invitation token (e.g., 24 hours from creation)
const getTokenExpirationDate = () => {
    const expirationHours = 24;
    return new Date(Date.now() + expirationHours * 60 * 60 * 1000); // 24 hours
};

// Endpoint to send invitation
router.post('/send-invite', async (req, res) => {
    const { firstName, lastName, email, phone, address, role } = req.body;

    try {
        // Validate input
        if (!firstName || !lastName || !email || !role) {
            return res.status(400).json({ message: 'First name, last name, email, and role are required' });
        }

        // Generate a unique token and expiration date
        const token = generateInvitationToken();
        const tokenExpiration = getTokenExpirationDate();

        // Create or update the user with the invitation details
        await UserDetails.upsert({
            firstName,
            lastName,
            email,
            phone,
            address,
            role,
            invitationToken: token,
            invitationCreatedAt: new Date(),
            tokenExpiration // Store token expiration date
        });

        // Set up email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Invitation to Join',
            text: `Hello ${firstName} ${lastName},\n\nYou have been invited to join our platform. Click the following link to set your password and complete your profile: http://localhost:3000/set-password?token=${token}\n\nBest regards,\nTeam`
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Invitation sent successfully' });
    } catch (error) {
        console.error('Error sending invitation:', error.message);
        res.status(500).json({ message: 'Error sending invitation', error: error.message });
    }
});

// Endpoint to set password and complete user profile using token
router.post('/set-password', async (req, res) => {
    const { token, password } = req.body;

    try {
        // Validate input
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        // Find the user by the invitation token
        const user = await UserDetails.findOne({ where: { invitationToken: token } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Check if the token has expired
        if (new Date() > new Date(user.tokenExpiration)) {
            return res.status(400).json({ message: 'Token has expired' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user with new password and remove invitation token
        await user.update({
            password: hashedPassword,
            invitationToken: null,
            invitationCreatedAt: null,
            tokenExpiration: null // Clear token expiration date
        });

        res.status(200).json({ message: 'Password set and user profile updated successfully' });
    } catch (error) {
        console.error('Error setting password:', error.message);
        res.status(500).json({ message: 'Error setting password', error: error.message });
    }
});

module.exports = router;
