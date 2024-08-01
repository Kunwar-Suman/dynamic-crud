// models/internshipDetails.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../sequelize');
const UserDetails = require('./userDetails');

const InternshipDetails = sequelize.define('internship_details', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: UserDetails,
      key: 'id',
    },
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  mentorName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = InternshipDetails;
