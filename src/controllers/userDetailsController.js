const UserDetails = require('../models/userDetails'); 

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, password, role } = req.body;

    const newUser = await UserDetails.create({
      firstName,
      lastName,
      email,
      phone,
      address,
      password,
      role
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserDetails.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json({
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Update user by ID
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, address, password, role } = req.body;

    const user = await UserDetails.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (password) {
      user.password = password;
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.role = role || user.role;

    await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserDetails.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    await user.destroy();

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserDetails.findAll();

    res.status(200).json({
      users
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
};
