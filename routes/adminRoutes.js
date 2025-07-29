const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/eventUpload');
const {verifyAdmin}=require("../middleware/authMiddleware");



router.get('/dashboard',verifyAdmin,  adminController.getDashboard);

// Manage Events
router.post('/events/add',verifyAdmin, upload.single('image'), adminController.createEvent);
router.get('/events',verifyAdmin,  adminController.getEvents);
router.get('/events/add', verifyAdmin, adminController.addEventForm);
// router.post('/events/add', verifyAdminToken, adminController.addEvent);
router.get('/events/edit/:id', verifyAdmin, adminController.editEventForm);
router.post('/events/edit/:id', verifyAdmin, adminController.updateEvent);
router.get('/events/delete/:id', verifyAdmin,  adminController.deleteEvent);
router.get('/events/:id/registrations',verifyAdmin, adminController.getEventRegistrations);



router.get('/logout',verifyAdmin, adminController.logoutAdmin);
// Users list + search
router.get('/users', verifyAdmin, adminController.getUsers);

// Delete user
router.get('/users/delete/:id',verifyAdmin, adminController.deleteUser);

// Block/Unblock user
router.get('/users/toggle-block/:id',verifyAdmin, adminController.toggleBlock);

module.exports = router;
