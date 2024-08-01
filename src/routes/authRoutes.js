const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const UserDetails = require('../models/userDetails');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await UserDetails.findOne({
        where: { email: { [Op.like]: email } } 
      });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).json({ error: 'Server error during login' });
    }
  });
  
  //Reg
  router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, phone, address, isAdmin } = req.body;
    try {
        const existingUser = await UserDetails.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Determine role based on `isAdmin` flag
        const role = isAdmin ? 'admin' : 'user';

        // Create new user
        const newUser = await UserDetails.create({
            firstName,
            lastName,
            email,
            password,
            phone,
            address,
            role
        });

        // Generate a token for the newly created user
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({ 
            message: 'User created successfully', 
            token, 
            user: { id: newUser.id, email: newUser.email, role: newUser.role } 
        });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});



  

module.exports = router;
