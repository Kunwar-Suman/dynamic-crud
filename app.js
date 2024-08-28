require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const UserDetails = require('./src/models/userDetails');
const InternshipDetails = require('./src/models/internshipDetails');
const authRoutes = require('./src/routes/authRoutes');
const userRouter = require('./src/routes/userRouter');

const redis = require('@redis/client');
const util = require('util');
const REDIS_URL = process.env.REDIS_URL;

// Initialize Redis client
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.on('error', (err) => console.error('Redis error:', err));

// Use promises for Redis commands
const redisGet = redisClient.get.bind(redisClient);
const redisSet = redisClient.set.bind(redisClient);
const redisDel = redisClient.del.bind(redisClient);

async function cacheData(key, fetchFunction) {
  try {
    // Check Redis cache
    const cachedData = await redisGet(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Fetch from database if not in cache
    const data = await fetchFunction();

    // Store in Redis cache
    await redisSet(key, JSON.stringify(data), { EX: 3600 }); // Cache for 1 hour

    return data;
  } catch (err) {
    console.error('Error in cacheData:', err);
    // Fallback to direct fetch if cache fails
    return fetchFunction();
  }
}



const inviteRoutes = require('./src/routes/inviteRoutes');
const cors = require('cors');
const path = require('path');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors(
  {
    origin: 'http://localhost:3001', // Allow requests from this origin
    methods: 'GET,POST,PUT,DELETE', // Allow these methods
  }
));

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

app.use(express.json());
app.use('/api', inviteRoutes);
app.use('/api/user_details', userRouter);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../my-app/build')));

// Dynamically generate CRUD endpoints for models
const models = [UserDetails, InternshipDetails];
models.forEach(model => {
    const modelName = model.name.toLowerCase();

  // Middleware applied to all endpoints for this model
  app.use(`/api/${modelName}`, authenticateToken);

  // CRUD endpoints
  app.get(`/api/${modelName}`, authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
      const data = await cacheData(`${modelName}_all`, async () => model.findAll());
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get(`/api/${modelName}/:id`, authenticateToken, async (req, res) => {
    const id = req.params.id;
    try {
      const data = await cacheData(`${modelName}_${id}`, async () => model.findByPk(id));
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
      await redisDel(`${modelName}_all`);
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
        await redisDel(`${modelName}_${id}`);
        await redisDel(`${modelName}_all`);
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
        await redisDel(`${modelName}_${id}`);
        await redisDel(`${modelName}_all`);
        res.json({ message: 'Deleted successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

app.get('/api/user_details/search', authenticateToken, async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const cacheKey = `user_details_search_${query}`;
    const results = await cacheData(cacheKey, async () => UserDetails.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ]
      }
    }));

    if (results.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    res.status(200).json(results);
  } catch (err) {
    console.error('Error during search:', err);
    res.status(500).json({ error: 'Server error during search' });
  }
});

// Catch-all handler for React routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../my-app/build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


module.exports = app; // Export the app for testing
