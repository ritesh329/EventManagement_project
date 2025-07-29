const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const bucket = require('../config/firebase');
const path = require('path');
const axios = require('axios');
const { PassThrough } = require('stream');


// ✅ Get Event Details + Registered Users
exports.getEventDetails = async (req, res) => {
  try {
    const eventId = req.params.id;

   
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).render('fail', {
  message: 'Event Not Found'
});
    }


    const registrations = await Registration.find({ eventId })
      .populate('userId', 'name email'); 

  
    res.status(200).json({
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        location: event.location,
        capacity: event.capacity,
        description: event.description,
      },
      registeredUsers: registrations.map(reg => ({
        id: reg.userId._id,
        name: reg.userId.name,
        email: reg.userId.email
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(400).render('fail', {
  message: 'Invalid Event ID or server error'
});
  }
};


exports.registerUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const eventId = req.params.id;

    // Validate Event and User
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).render('fail', {
  message: 'Event Not Found'
});

    const user = await User.findById(userId);
    if (!user) return res.status(404).render('fail', {
  message: 'User Not Found'
});

    // Past event check
    if (new Date(event.date) < new Date()) {
      return res.status(400).render('fail', {
  message: 'Cannot Register for Past Events'
});
    }

    // Already registered
    const alreadyRegistered = await Registration.findOne({ userId, eventId });
    if (alreadyRegistered) {
      return res.status(400).render('fail', {
  message: 'User Already Registered'
});
    }

    // Capacity check
    const total = await Registration.countDocuments({ eventId });
    if (total >= event.capacity) {
      return res.status(400).render('fail', {
  message: 'Event is Full'
});
    }

      
    /** 1. Generate QR code (Buffer, no file) */
    const qrData = JSON.stringify({ userId, eventId });
    const qrBuffer = await QRCode.toBuffer(qrData);

    /** 2. Download profile image (Buffer) */
    let profileImageBuffer = null;
    if (user.profileImage) {
      try {
        const resp = await axios.get(user.profileImage, { responseType: 'arraybuffer' });
        profileImageBuffer = Buffer.from(resp.data, 'binary');
      } catch (err) {
        console.warn('Profile image not loaded:', err.message);
      }
    }

    /** 3. Create PDF (in memory) */
    const pdfDoc = new PDFDocument({ size: 'A4', margin: 0 });
    const passThrough = new PassThrough();

    // Firebase destination
    const destination = `certificates/${userId}-${eventId}.pdf`;
    const file = bucket.file(destination);
    const firebaseStream = file.createWriteStream({
      metadata: { contentType: 'application/pdf' },
    });

    // Pipe PDF to Firebase directly
    passThrough.pipe(firebaseStream);
    pdfDoc.pipe(passThrough);

    /** === Design === **/
    const primaryColor = '#6a11cb';
    const secondaryColor = '#2575fc';
    const accentColor = '#ff9a44';
    const textColor = '#333';
    const lightText = '#666';

    // Header
    const headerHeight = 120;
    const gradient = pdfDoc.linearGradient(0, 0, 0, headerHeight);
    gradient.stop(0, primaryColor).stop(1, secondaryColor);
    pdfDoc.rect(0, 0, pdfDoc.page.width, headerHeight).fill(gradient);

    pdfDoc.fontSize(20).fillColor('white').font('Helvetica-Bold')
      .text('EVENT HORIZON', 50, 40);
    pdfDoc.fontSize(14).fillColor('white').text('Registration Certificate', 50, 70);

    // Profile image
    if (profileImageBuffer) {
      const centerX = pdfDoc.page.width / 2 - 50;
      const profileY = headerHeight - 50;
      pdfDoc.save();
      pdfDoc.circle(centerX + 50, profileY + 50, 50).clip();
      pdfDoc.image(profileImageBuffer, centerX, profileY, { width: 100, height: 100 });
      pdfDoc.restore();
      pdfDoc.circle(centerX + 50, profileY + 50, 50).lineWidth(3).stroke(accentColor);
    }

    // Title
    pdfDoc.fontSize(28).fillColor(textColor).font('Helvetica-Bold')
      .text('EVENT REGISTRATION', 0, headerHeight + 70, { align: 'center' });

    // Details
    const detailsY = headerHeight + 140;
    const boxWidth = pdfDoc.page.width - 100;
    pdfDoc.roundedRect(50, detailsY, boxWidth, 180, 10)
      .fill('#ffffff').stroke('#eeeeee');

    const drawDetail = (label, value, y) => {
      pdfDoc.fontSize(12).fillColor(lightText).text(label, 60, y)
        .fillColor(textColor).font('Helvetica-Bold').text(value, 180, y);
    };

    pdfDoc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold')
      .text('PARTICIPANT DETAILS', 50, detailsY + 20);

    const dY = detailsY + 50;
    drawDetail('Full Name:', user.name, dY);
    drawDetail('Email:', user.email, dY + 25);
    drawDetail('Registration Date:', new Date().toLocaleDateString(), dY + 50);

    pdfDoc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold')
      .text('EVENT DETAILS', 50, dY + 85);

    drawDetail('Event Name:', event.title, dY + 115);
    drawDetail('Date & Time:', new Date(event.date).toLocaleString(), dY + 140);
    drawDetail('Location:', event.location, dY + 165);

    // QR Code (from buffer)
    const qrSectionY = detailsY + 220;
    pdfDoc.fontSize(14).fillColor(lightText)
      .text('Present this QR code at the event for check-in:', 0, qrSectionY, { align: 'center' });

    const qrSize = 120;
    const qrX = pdfDoc.page.width / 2 - qrSize / 2;
    pdfDoc.rect(qrX - 10, qrSectionY + 20, qrSize + 20, qrSize + 20)
      .fill('#f9f9f9').stroke('#eeeeee');
    pdfDoc.image(qrBuffer, qrX, qrSectionY + 30, { width: qrSize, height: qrSize });

    // Footer
    const footerY = pdfDoc.page.height - 60;
    pdfDoc.fontSize(10).fillColor(lightText)
      .text('This certificate is proof of registration and must be presented at the event.',
        50, footerY, { width: pdfDoc.page.width - 100, align: 'center' })
      .text('© 2025 Event Horizon. All rights reserved.', 0, footerY + 20, { align: 'center' });

    pdfDoc.end();

    /** After upload finishes */
    firebaseStream.on('finish', async () => {
      await file.makePublic();
      const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;

      await new Registration({
        userId,
        eventId,
        certificateUrl: url
      }).save();

      return res.status(200).render('success', {
    certificate: url
  });
    });

    firebaseStream.on('error', (err) => {
      console.error('Upload error:', err);
      // res.status(500).json({ error: 'Failed to upload certificate' });

      // 'Failed to upload certificate'

      res.status(400).render('fail', {
 
  message: 'Failed to upload certificate'
});

    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).render('fail', {
 
  message: 'Server error during registration'
});
  }
};
exports.cancelRegistration = async (req, res) => {
  try {
    const { userId } = req.user;
    const eventId = req.params.id;

    // 1. Delete registration from DB
    const reg = await Registration.findOneAndDelete({ userId, eventId });

    if (!reg) {
      return res.status(404).render('fail', {
  message: 'User Was Not Registered for this Events'
});
    }

    // 2. Firebase file path (based on how you stored it during registration)
    const firebaseFilePath = `certificates/${userId}-${eventId}.pdf`;

    // Delete PDF from Firebase
    try {
      await bucket.file(firebaseFilePath).delete();
      console.log(`Deleted PDF from Firebase: ${firebaseFilePath}`);
    } catch (err) {
      
      console.warn('Firebase PDF delete warning:', err.message);
    }

    
    return res.status(200). render('fail', {
  message: 'Registration cancelled and certificate deleted successfully'
});
   

  } catch (err) {
    console.error('Cancel Registration Error:', err);
    return res.status(500).render('fail', {
  message: 'Server Error'
});
  }
};


// ✅ List Upcoming Events
// exports.listUpcomingEvents = async (req, res) => {
//   try {
//     const now = new Date();
//     const events = await Event.find({ date: { $gt: now } }).sort({ date: 1, location: 1 });

//     res.json(events);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// };



// Search / Filter Events
exports.searchEvents = async (req, res) => {
  try {
    const { title, location, date, category, minCapacity, maxCapacity } = req.query;

    // Dynamic query object
    const filter = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' }; // case-insensitive
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (date) {
      // fetch events on or after given date
      filter.date = { $gte: new Date(date) };
    }
    if (category) {
      filter.category = category;
    }
    if (minCapacity || maxCapacity) {
      filter.capacity = {};
      if (minCapacity) filter.capacity.$gte = Number(minCapacity);
      if (maxCapacity) filter.capacity.$lte = Number(maxCapacity);
    }

    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};



exports.getAllevent = async (req, res) => {
  try {
    // Aggregation for all events with remaining capacity
    const eventdata = await Event.aggregate([
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'eventId',
          as: 'registrations'
        }
      },
      {
        $addFields: {
          registered: { $size: '$registrations' },
          remainingCapacity: {
            $max: [
              { $subtract: ['$capacity', { $size: '$registrations' }] },
              0
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          location: 1,
          date: 1,
          capacity: 1,
          image: 1,
          registered: 1,
          remainingCapacity: 1
           
        }
      },
      {
        $sort: { date: 1 } 
      }
    ]);

    if (!eventdata || eventdata.length === 0) {
  return res.status(200).render('Home', { 
    upcoming: [], 
    past: [] 
  });
}


    // Current date without time for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Separate upcoming/current and past events
    const upcomingEvents = [];
    const pastEvents = [];

    eventdata.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= today) {
        upcomingEvents.push(event);
      } else {
        pastEvents.push(event);
      }
    });

    console.log({
      upcoming: upcomingEvents.length,
      past: pastEvents.length
    });

    res.status(200).render('Home', { 
      upcoming: upcomingEvents, 
      past: pastEvents 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('server error');
  }
};




exports.getEventById = async (req, res) => {
  try {
    const eventId = req.params.id; 

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).send('Invalid event ID');
    }

    const eventdata = await Event.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(eventId) } 
      },
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'eventId',
          as: 'registrations'
        }
      },
      {
        $addFields: {
          registered: { $size: '$registrations' },
          remainingCapacity: {
            $max: [
              { $subtract: ['$capacity', { $size: '$registrations' }] },
              0
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          location: 1,
          date:1,
          capacity: 1,
          image: 1,
          registered: 1,
          remainingCapacity: 1,
          description:1
        }
      }
    ]);

    if (!eventdata || eventdata.length === 0) {
      return res.status(404).send('Event not found');
    }

    console.log(eventdata);

    res.status(200).render('event-details', { event: eventdata[0] }); 
   
  } catch (err) {
    console.error(err);
    return res.status(500).send('server error');
  }
};


exports.getAllUserRegisterdEvent = async (req, res) => {
  try {
    const userId = req.user.userId;

    
    const userdata = await User.findById(userId);
    if (!userdata) {
      return res.status(404).json({ error: 'User not found' });
    }


    const registrations = await Registration.find({ userId })
      .populate('eventId'); 

   
    res.status(200).render('my-registered-events', {
      user: {
        id: userdata._id,
        name: userdata.name,
        email: userdata.email
      },
      registeredEvents: registrations.map(reg => ({
        id: reg.eventId._id,
        title: reg.eventId.title,
        location: reg.eventId.location,
        date: reg.eventId.date,
        image: reg.eventId.image,
  
        certificateUrl: reg.certificateUrl || null 
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid user ID or server error' });
  }
};
