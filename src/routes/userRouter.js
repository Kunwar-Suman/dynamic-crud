const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env; // Ensure JWT_SECRET is loaded from your environment
const UserDetails = require('../models/userDetails');
const { Op } = require('sequelize');

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Search route
router.get('/search', authenticateToken, async (req, res) => {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const pageSize = parseInt(req.query.pageSize) || 10; // Default to 10 results per page
  
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
  
    try {
      const { count, rows } = await UserDetails.findAndCountAll({
        where: {
          [Op.or]: [
            { firstName: { [Op.like]: `%${query}%` } },
            { lastName: { [Op.like]: `%${query}%` } },
            { email: { [Op.like]: `%${query}%` } }
          ]
        },
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
  
      res.status(200).json({
        results: rows,
        totalResults: count,
        currentPage: page,
        totalPages: Math.ceil(count / pageSize)
      });
    } catch (err) {
      console.error('Error during search:', err);
      res.status(500).json({ error: 'Server error during search' });
    }
  });
  

module.exports = router;
