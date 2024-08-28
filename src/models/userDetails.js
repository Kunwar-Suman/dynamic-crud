const { DataTypes, Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: process.env.ELASTICSEARCH_URL });

const sequelize = new Sequelize('internship_mgmt', 'root', 'suman', {
  host: 'localhost',
  dialect: 'mysql'
});

const UserDetails = sequelize.define('user_details', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING, // Store hashed passwords
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
  },
  invitationToken:{
    type: DataTypes.STRING

  } 

}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    afterCreate: async (user) => {
      try {
        await client.index({
          index: 'users',
          id: user.id.toString(),
          body: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role
          }
        });
      } catch (error) {
        console.error('Error indexing document to Elasticsearch after create:', error);
      }
    },
    afterUpdate: async (user) => {
      try {
        await client.update({
          index: 'users',
          id: user.id.toString(),
          body: {
            doc: {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              address: user.address,
              role: user.role
            }
          }
        });
      } catch (error) {
        console.error('Error updating document in Elasticsearch after update:', error);
      }
    },
    beforeDestroy: async (user) => {
      try {
        await client.delete({
          index: 'users',
          id: user.id.toString()
        });
      } catch (error) {
        console.error('Error deleting document from Elasticsearch before destroy:', error);
      }
    }
  }
});
// Method to validate the password
UserDetails.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = UserDetails;
