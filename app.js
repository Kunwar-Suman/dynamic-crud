const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const UserDetails = require('./src/models/userDetails');
const InternshipDetails = require('./src/models/internshipDetails');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';


// Here FE is references SUMAN
app.use(cors({
    origin: 'http://localhost:3000', // URL of your React app
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// Middleware for authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Middleware for role-based authorization
function authorizeRole(roles) {
    return (req, res, next) => {
      console.log('User Role:', req.user.role);  
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      next();
    };
  }
  

// Use authentication routes
app.use('/api/auth', authRoutes);

// Dynamically generate CRUD endpoints for models
const models = [UserDetails, InternshipDetails];
models.forEach(model => {
    const modelName = model.name.toLowerCase();

  // Middleware applied to all endpoints for this model
  app.use(`/api/${modelName}`, authenticateToken);

  // CRUD endpoints
  app.get(`/api/${modelName}`, authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
      const data = await model.findAll();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get(`/api/${modelName}/:id`, authenticateToken, async (req, res) => {
    const id = req.params.id;
    try {
      const data = await model.findByPk(id);
      if (!data) {
        res.status(404).json({ error: 'Not found' });
      } else {
        res.json(data);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post(`/api/${modelName}`, authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const newData = req.body;
    try {
      const created = await model.create(newData);
      res.status(201).json(created);
    } catch (err) {
      if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(error => ({
          message: error.message,
          field: error.path
        }));
        console.error('Validation errors:', errors);
        res.status(400).json({ error: 'Validation error', details: errors });
      } else {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      }
    }
  });

  app.put(`/api/${modelName}/:id`, authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const id = req.params.id;
    const updateData = req.body;
    try {
      const data = await model.findByPk(id);
      if (!data) {
        res.status(404).json({ error: 'Not found' });
      } else {
        await data.update(updateData);
        res.json(data);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete(`/api/${modelName}/:id`, authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const id = req.params.id;
    try {
      const data = await model.findByPk(id);
      if (!data) {
        res.status(404).json({ error: 'Not found' });
      } else {
        await data.destroy();
        res.json({ message: 'Deleted successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


module.exports = app; // Export the app for testing
