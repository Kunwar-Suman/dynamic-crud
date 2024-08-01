const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('internship_mgmt', 'root', 'suman', {
  host: 'localhost',
  dialect: 'mysql',
  define: {
    timestamps: true, // Adds createdAt and updatedAt columns automatically
  },
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection(); // Optionally test the connection on startup

module.exports = sequelize;
