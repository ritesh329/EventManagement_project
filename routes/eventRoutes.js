const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

//! THIS USER SECTION

router.get('/events/:id', verifyToken,eventController.getEventById);
// router.get('/events/search', eventController.searchEvents);
router.get('/events/search', verifyToken,eventController.searchEvents);

router.get('/events/:id/register',verifyToken, eventController.registerUser);
router.get('/getAllEvents',verifyToken, eventController.getAllevent);
router.get('/getusereventdata',verifyToken,eventController.getAllUserRegisterdEvent);
router.post('/events/:id/cancel', verifyToken, eventController.cancelRegistration);
module.exports = router;
