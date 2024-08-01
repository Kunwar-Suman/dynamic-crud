const InternshipDetails = require('../models/internshipDetails'); // Adjust the path according to your project structure
const UserDetails = require('../models/userDetails'); // Adjust the path according to your project structure

// Create a new internship detail
exports.createInternship = async (req, res) => {
  try {
    const { userId, companyName, startDate, endDate, mentorName } = req.body;

    // Validate if user exists
    const user = await UserDetails.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newInternship = await InternshipDetails.create({
      userId,
      companyName,
      startDate,
      endDate,
      mentorName
    });

    res.status(201).json({
      message: 'Internship created successfully',
      internship: newInternship
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating internship',
      error: error.message
    });
  }
};

// Get internship details by ID
exports.getInternshipById = async (req, res) => {
  try {
    const { id } = req.params;
    const internship = await InternshipDetails.findByPk(id);

    if (!internship) {
      return res.status(404).json({
        message: 'Internship not found'
      });
    }

    res.status(200).json({
      internship
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching internship',
      error: error.message
    });
  }
};

// Update internship details by ID
exports.updateInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, companyName, startDate, endDate, mentorName } = req.body;

    const internship = await InternshipDetails.findByPk(id);

    if (!internship) {
      return res.status(404).json({
        message: 'Internship not found'
      });
    }

    // Optional: Validate if user exists
    if (userId) {
      const user = await UserDetails.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    internship.userId = userId || internship.userId;
    internship.companyName = companyName || internship.companyName;
    internship.startDate = startDate || internship.startDate;
    internship.endDate = endDate || internship.endDate;
    internship.mentorName = mentorName || internship.mentorName;

    await internship.save();

    res.status(200).json({
      message: 'Internship updated successfully',
      internship
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating internship',
      error: error.message
    });
  }
};

// Delete internship details by ID
exports.deleteInternship = async (req, res) => {
  try {
    const { id } = req.params;

    const internship = await InternshipDetails.findByPk(id);

    if (!internship) {
      return res.status(404).json({
        message: 'Internship not found'
      });
    }

    await internship.destroy();

    res.status(200).json({
      message: 'Internship deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting internship',
      error: error.message
    });
  }
};

// Get all internships
exports.getAllInternships = async (req, res) => {
  try {
    const internships = await InternshipDetails.findAll();

    res.status(200).json({
      internships
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching internships',
      error: error.message
    });
  }
};
