const express = require('express');
const router = express.Router();
const userController = require('../controllers/userDetailsController');
const internshipController = require('../controllers/internshipDetailsController');


router.post('/users', userController.createUser);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.get('/users', userController.getAllUsers);


router.post('/internships', internshipController.createInternship);
router.get('/internships/:id', internshipController.getInternshipById);
router.put('/internships/:id', internshipController.updateInternship);
router.delete('/internships/:id', internshipController.deleteInternship);
router.get('/internships', internshipController.getAllInternships);

module.exports = router;
