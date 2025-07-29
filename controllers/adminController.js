const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');
const bucket = require('../config/firebase');
const mongoose = require('mongoose');

exports.getDashboard = async (req, res) => {
  const totalEvents = await Event.countDocuments();
  const totalUsers = await User.countDocuments();
  const upcomingEvents = await Event.countDocuments({ date: { $gte: new Date() }});
  const registrations = await Registration.countDocuments();

  const recent = await Registration.find()
    .populate('userId', 'name email')
    .populate('eventId', 'title')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentData = recent.map(r => ({
    userName: r.userId?.name,
    email: r.userId?.email,
    eventTitle: r.eventId?.title,
    createdAt: r?.createdAt
  }));

  res.render('admin/dashboard', {
    stats: { totalEvents, totalUsers, upcomingEvents, registrations },
    recent: recentData
  });
};
exports.createEvent = async (req, res) => {
  try {
    const { title, date, location, capacity , description   } = req.body;

    // Validation
    if (!title || !date || !location || !capacity || !req.file || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (capacity <= 0 || capacity > 1000) {
      return res.status(400).json({ error: 'Capacity must be between 1 and 1000' });
    }

    // === Upload image directly to Firebase ===
    let imageUrl = null;
    if (req.file) {
      // unique destination path in firebase storage
      const destination = `event-images/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(destination);

      // Upload buffer to Firebase (no local save)
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        public: true,
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      // Generate signed URL for public access
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2030', // long expiry
      });

      imageUrl = url;
    }

    // Save Event to MongoDB
    const event = new Event({
      title,
      date,
      location,
      capacity,
      image: imageUrl,
      description
    });

    await event.save();

    // res.status(201).json({
    //   message: 'Event created successfully',
    //   eventId: event._id,
    //   imageUrl: imageUrl,
    // });

    res.redirect('/admin/events');
  } catch (err) {
    console.error('Event creation error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};


exports.getEvents = async (req, res) => {
  const events = await Event.find().sort({ date: 1 });
  res.render('admin/events', { events });
};

// Add event form
exports.addEventForm = (req, res) => {
  res.render('admin/addEvent');
};



// Edit event form
exports.editEventForm = async (req, res) => {
  const event = await Event.findById(req.params.id);
  res.render('admin/editEvent', { event });
};

// Update event POST
exports.updateEvent = async (req, res) => {
  const { title, location, date, capacity ,description} = req.body;
  await Event.findByIdAndUpdate(req.params.id, { title, location, date, capacity ,description});
  res.redirect('/admin/events');
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // 1. Event fetch
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).send('Event not found');
    }

 

    if (event.image) {
      try {
        const url = new URL(event.image);
        let parts = url.pathname.split('/');
        parts.shift(); // remove empty
        parts.shift(); // remove bucket name
        const filePath = parts.join('/');

        await bucket.file(filePath).delete();
        console.log('Event image deleted:', filePath);
      } catch (imgErr) {
        console.error('Image delete failed:', imgErr.message);
        return res.status(500).send('Failed to delete image. Event not deleted.');
      }
    }

    // 3. Event delete
    await Event.findByIdAndDelete(eventId);

    // 4. Related registrations delete
    await Registration.deleteMany({ eventId });

    console.log('Event and related registrations deleted');
    res.redirect('/admin/events');

  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).send('Failed to delete event');
  }
};

// View event registrations
exports.getEventRegistrations = async (req, res) => {
  const registrations = await Registration.find({ eventId: req.params.id })
    .populate('userId', 'name email');
  res.render('admin/eventRegistrations', { registrations });
};




exports.getUsers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };
    const users = await User.find(query).sort({ createdAt: -1 });
    res.render('admin/users', { users, search });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Server error');
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

   
    if (user.profileImage && user.profileImage.includes('storage.googleapis.com')) {
      try {
      
        const filePath = user.profileImage.split(`/${bucket.name}/`)[1];
        if (filePath) {
          await bucket.file(filePath).delete();
          console.log('Profile image deleted from Firebase:', filePath);
        }
      } catch (imgErr) {
        console.error('Profile image delete failed:', imgErr.message);
        return res.status(500).send('Image delete failed, user not deleted.');
      }
    }

  
    await Registration.deleteMany({ userId: req.params.id });


    await User.findByIdAndDelete(req.params.id);

    console.log('User and related registrations deleted successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).send('Error deleting user');
  }
};
exports.toggleBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Block/unblock error:', err);
    res.status(500).send('Error updating user');
  }
};