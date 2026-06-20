// // const Event = require('../models/Event');
// // const User = require('../models/User');
// // const Registration = require('../models/Registration');
// // const bucket = require('../config/firebase');
// // const mongoose = require('mongoose');

// // exports.getDashboard = async (req, res) => {
// //   const totalEvents = await Event.countDocuments();
// //   const totalUsers = await User.countDocuments();
// //   const upcomingEvents = await Event.countDocuments({ date: { $gte: new Date() }});
// //   const registrations = await Registration.countDocuments();

// //   const recent = await Registration.find()
// //     .populate('userId', 'name email')
// //     .populate('eventId', 'title')
// //     .sort({ createdAt: -1 })
// //     .limit(5);

// //   const recentData = recent.map(r => ({
// //     userName: r.userId?.name,
// //     email: r.userId?.email,
// //     eventTitle: r.eventId?.title,
// //     createdAt: r?.createdAt
// //   }));

// //   res.render('admin/dashboard', {
// //     stats: { totalEvents, totalUsers, upcomingEvents, registrations },
// //     recent: recentData
// //   });
// // };
// // exports.createEvent = async (req, res) => {
// //   try {
// //     const { title, date, location, capacity , description   } = req.body;

// //     // Validation
// //     if (!title || !date || !location || !capacity || !req.file || !description) {
// //       return res.status(400).json({ error: 'All fields are required' });
// //     }

// //     if (capacity <= 0 || capacity > 1000) {
// //       return res.status(400).json({ error: 'Capacity must be between 1 and 1000' });
// //     }

// //     // === Upload image directly to Firebase ===
// //     let imageUrl = null;
// //     if (req.file) {
// //       // unique destination path in firebase storage
// //       const destination = `event-images/${Date.now()}-${req.file.originalname}`;
// //       const file = bucket.file(destination);

// //       // Upload buffer to Firebase (no local save)
// //       await file.save(req.file.buffer, {
// //         contentType: req.file.mimetype,
// //         public: true,
// //         metadata: {
// //           contentType: req.file.mimetype,
// //         },
// //       });

// //       // Generate signed URL for public access
// //       const [url] = await file.getSignedUrl({
// //         action: 'read',
// //         expires: '03-01-2030', // long expiry
// //       });

// //       imageUrl = url;
// //     }

// //     // Save Event to MongoDB
// //     const event = new Event({
// //       title,
// //       date,
// //       location,
// //       capacity,
// //       image: imageUrl,
// //       description
// //     });

// //     await event.save();

// //     // res.status(201).json({
// //     //   message: 'Event created successfully',
// //     //   eventId: event._id,
// //     //   imageUrl: imageUrl,
// //     // });

// //     res.redirect('/admin/events');
// //   } catch (err) {
// //     console.error('Event creation error:', err);
// //     res.status(500).json({ error: 'Server Error' });
// //   }
// // };


// // exports.getEvents = async (req, res) => {
// //   const events = await Event.find().sort({ date: 1 });
// //   res.render('admin/events', { events });
// // };

// // // Add event form
// // exports.addEventForm = (req, res) => {
// //   res.render('admin/addEvent');
// // };



// // // Edit event form
// // exports.editEventForm = async (req, res) => {
// //   const event = await Event.findById(req.params.id);
// //   res.render('admin/editEvent', { event });
// // };

// // // Update event POST
// // exports.updateEvent = async (req, res) => {
// //   const { title, location, date, capacity ,description} = req.body;
// //   await Event.findByIdAndUpdate(req.params.id, { title, location, date, capacity ,description});
// //   res.redirect('/admin/events');
// // };

// // // Delete event
// // exports.deleteEvent = async (req, res) => {
// //   try {
// //     const eventId = req.params.id;

// //     // 1. Event fetch
// //     const event = await Event.findById(eventId);
// //     if (!event) {
// //       return res.status(404).send('Event not found');
// //     }

 

// //     if (event.image) {
// //       try {
// //         const url = new URL(event.image);
// //         let parts = url.pathname.split('/');
// //         parts.shift(); // remove empty
// //         parts.shift(); // remove bucket name
// //         const filePath = parts.join('/');

// //         await bucket.file(filePath).delete();
// //         console.log('Event image deleted:', filePath);
// //       } catch (imgErr) {
// //         console.error('Image delete failed:', imgErr.message);
// //         return res.status(500).send('Failed to delete image. Event not deleted.');
// //       }
// //     }

// //     // 3. Event delete
// //     await Event.findByIdAndDelete(eventId);

// //     // 4. Related registrations delete
// //     await Registration.deleteMany({ eventId });

// //     console.log('Event and related registrations deleted');
// //     res.redirect('/admin/events');

// //   } catch (err) {
// //     console.error('Delete event error:', err);
// //     res.status(500).send('Failed to delete event');
// //   }
// // };

// // // View event registrations
// // exports.getEventRegistrations = async (req, res) => {
// //   const registrations = await Registration.find({ eventId: req.params.id })
// //     .populate('userId', 'name email');
// //   res.render('admin/eventRegistrations', { registrations });
// // };




// // exports.getUsers = async (req, res) => {
// //   try {
// //     const search = req.query.search || '';
// //     const query = {
// //       $or: [
// //         { name: { $regex: search, $options: 'i' } },
// //         { email: { $regex: search, $options: 'i' } }
// //       ]
// //     };
// //     const users = await User.find(query).sort({ createdAt: -1 });
// //     res.render('admin/users', { users, search });
// //   } catch (err) {
// //     console.error('Error fetching users:', err);
// //     res.status(500).send('Server error');
// //   }
// // };


// // exports.deleteUser = async (req, res) => {
// //   try {
// //     const user = await User.findById(req.params.id);

// //     if (!user) {
// //       return res.status(404).send('User not found');
// //     }

   
// //     if (user.profileImage && user.profileImage.includes('storage.googleapis.com')) {
// //       try {
      
// //         const filePath = user.profileImage.split(`/${bucket.name}/`)[1];
// //         if (filePath) {
// //           await bucket.file(filePath).delete();
// //           console.log('Profile image deleted from Firebase:', filePath);
// //         }
// //       } catch (imgErr) {
// //         console.error('Profile image delete failed:', imgErr.message);
// //         return res.status(500).send('Image delete failed, user not deleted.');
// //       }
// //     }

  
// //     await Registration.deleteMany({ userId: req.params.id });


// //     await User.findByIdAndDelete(req.params.id);

// //     console.log('User and related registrations deleted successfully');
// //     res.redirect('/admin/users');
// //   } catch (err) {
// //     console.error('Delete user error:', err);
// //     res.status(500).send('Error deleting user');
// //   }
// // };
// // exports.toggleBlock = async (req, res) => {
// //   try {
// //     const user = await User.findById(req.params.id);
// //     if (!user) return res.status(404).send('User not found');
// //     user.isBlocked = !user.isBlocked;
// //     await user.save();
// //     res.redirect('/admin/users');
// //   } catch (err) {
// //     console.error('Block/unblock error:', err);
// //     res.status(500).send('Error updating user');
// //   }
// // };

// // // adminController.js

// // exports.logoutAdmin = (req, res) => {
// //   try {
  
// //     res.clearCookie('token'); 
// //     return res.redirect('/login'); 
// //   } catch (err) {
// //     console.error('Logout error:', err);
// //     res.status(500).send('Server error');
// //   }
// // };


// const Event = require('../models/Event');
// const User = require('../models/User');
// const Registration = require('../models/Registration');
// const { cloudinary } = require('../config/cloudinary'); // Cloudinary import
// const mongoose = require('mongoose');

// exports.getDashboard = async (req, res) => {
//   const totalEvents = await Event.countDocuments();
//   const totalUsers = await User.countDocuments();
//   const upcomingEvents = await Event.countDocuments({ date: { $gte: new Date() }});
//   const registrations = await Registration.countDocuments();

//   const recent = await Registration.find()
//     .populate('userId', 'name email')
//     .populate('eventId', 'title')
//     .sort({ createdAt: -1 })
//     .limit(5);

//   const recentData = recent.map(r => ({
//     userName: r.userId?.name,
//     email: r.userId?.email,
//     eventTitle: r.eventId?.title,
//     createdAt: r?.createdAt
//   }));

//   res.render('admin/dashboard', {
//     stats: { totalEvents, totalUsers, upcomingEvents, registrations },
//     recent: recentData
//   });
// };

// exports.createEvent = async (req, res) => {
//   try {
//     const { title, date, location, capacity, description } = req.body;

//     // Validation
//     if (!title || !date || !location || !capacity || !req.file || !description) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     if (capacity <= 0 || capacity > 1000) {
//       return res.status(400).json({ error: 'Capacity must be between 1 and 1000' });
//     }

//     // === Upload image to Cloudinary ===
//     let imageUrl = null;
//     if (req.file) {
//       try {
//         // req.file.path contains Cloudinary URL (handled by multer-storage-cloudinary)
//         imageUrl = req.file.path;
//         console.log('Image uploaded to Cloudinary:', imageUrl);
//       } catch (uploadErr) {
//         console.error('Cloudinary upload error:', uploadErr);
//         return res.status(500).json({ error: 'Image upload failed' });
//       }
//     }

//     // Save Event to MongoDB
//     const event = new Event({
//       title,
//       date,
//       location,
//       capacity,
//       image: imageUrl,
//       description
//     });

//     await event.save();
//     res.redirect('/admin/events');
//   } catch (err) {
//     console.error('Event creation error:', err);
//     res.status(500).json({ error: 'Server Error' });
//   }
// };

// exports.getEvents = async (req, res) => {
//   const events = await Event.find().sort({ date: 1 });
//   res.render('admin/events', { events });
// };

// // Add event form
// exports.addEventForm = (req, res) => {
//   res.render('admin/addEvent');
// };

// // Edit event form
// exports.editEventForm = async (req, res) => {
//   const event = await Event.findById(req.params.id);
//   res.render('admin/editEvent', { event });
// };

// // Update event POST
// exports.updateEvent = async (req, res) => {
//   const { title, location, date, capacity, description } = req.body;
//   await Event.findByIdAndUpdate(req.params.id, { title, location, date, capacity, description });
//   res.redirect('/admin/events');
// };

// // Delete event
// exports.deleteEvent = async (req, res) => {
//   try {
//     const eventId = req.params.id;

//     // 1. Event fetch
//     const event = await Event.findById(eventId);
//     if (!event) {
//       return res.status(404).send('Event not found');
//     }

//     // 2. Delete image from Cloudinary
//     if (event.image) {
//       try {
//         // Extract public_id from Cloudinary URL
//         const publicId = extractPublicIdFromUrl(event.image);
//         if (publicId) {
//           const result = await cloudinary.uploader.destroy(publicId);
//           console.log('Cloudinary delete result:', result);
//           if (result.result === 'ok') {
//             console.log('Event image deleted from Cloudinary:', publicId);
//           }
//         }
//       } catch (imgErr) {
//         console.error('Image delete failed:', imgErr.message);
//         // Continue with event deletion even if image delete fails
//       }
//     }

//     // 3. Event delete
//     await Event.findByIdAndDelete(eventId);

//     // 4. Related registrations delete
//     await Registration.deleteMany({ eventId });

//     console.log('Event and related registrations deleted');
//     res.redirect('/admin/events');

//   } catch (err) {
//     console.error('Delete event error:', err);
//     res.status(500).send('Failed to delete event');
//   }
// };

// // View event registrations
// exports.getEventRegistrations = async (req, res) => {
//   const registrations = await Registration.find({ eventId: req.params.id })
//     .populate('userId', 'name email');
//   res.render('admin/eventRegistrations', { registrations });
// };

// exports.getUsers = async (req, res) => {
//   try {
//     const search = req.query.search || '';
//     const query = {
//       $or: [
//         { name: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } }
//       ]
//     };
//     const users = await User.find(query).sort({ createdAt: -1 });
//     res.render('admin/users', { users, search });
//   } catch (err) {
//     console.error('Error fetching users:', err);
//     res.status(500).send('Server error');
//   }
// };

// exports.deleteUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).send('User not found');
//     }

//     // Delete profile image from Cloudinary
//     if (user.profileImage && user.profileImage.includes('cloudinary')) {
//       try {
//         const publicId = extractPublicIdFromUrl(user.profileImage);
//         if (publicId) {
//           const result = await cloudinary.uploader.destroy(publicId);
//           if (result.result === 'ok') {
//             console.log('Profile image deleted from Cloudinary:', publicId);
//           }
//         }
//       } catch (imgErr) {
//         console.error('Profile image delete failed:', imgErr.message);
//         // Continue with user deletion
//       }
//     }

//     await Registration.deleteMany({ userId: req.params.id });
//     await User.findByIdAndDelete(req.params.id);

//     console.log('User and related registrations deleted successfully');
//     res.redirect('/admin/users');
//   } catch (err) {
//     console.error('Delete user error:', err);
//     res.status(500).send('Error deleting user');
//   }
// };

// exports.toggleBlock = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).send('User not found');
//     user.isBlocked = !user.isBlocked;
//     await user.save();
//     res.redirect('/admin/users');
//   } catch (err) {
//     console.error('Block/unblock error:', err);
//     res.status(500).send('Error updating user');
//   }
// };

// exports.logoutAdmin = (req, res) => {
//   try {
//     res.clearCookie('token');
//     return res.redirect('/login');
//   } catch (err) {
//     console.error('Logout error:', err);
//     res.status(500).send('Server error');
//   }
// };

// // Helper function to extract public_id from Cloudinary URL
// function extractPublicIdFromUrl(url) {
//   if (!url) return null;
  
//   try {
//     // Cloudinary URL format: 
//     // https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
//     // or https://res.cloudinary.com/cloud_name/image/upload/folder/filename.jpg
    
//     const parts = url.split('/');
//     const uploadIndex = parts.indexOf('upload');
    
//     if (uploadIndex === -1) return null;
    
//     // Get everything after 'upload' and before version number if exists
//     let pathParts = parts.slice(uploadIndex + 1);
    
//     // Remove version number if present (starts with 'v')
//     if (pathParts[0] && pathParts[0].startsWith('v')) {
//       pathParts = pathParts.slice(1);
//     }
    
//     // Remove file extension
//     const lastPart = pathParts[pathParts.length - 1];
//     const publicIdWithExt = lastPart.split('.')[0];
//     pathParts[pathParts.length - 1] = publicIdWithExt;
    
//     return pathParts.join('/');
//   } catch (err) {
//     console.error('Error extracting public_id:', err);
//     return null;
//   }
// }



const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');
const { cloudinary } = require('../config/cloudinary'); // Cloudinary import
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
    const { title, date, location, capacity, description } = req.body;

    // Validation
    if (!title || !date || !location || !capacity || !req.file || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (capacity <= 0 || capacity > 1000) {
      return res.status(400).json({ error: 'Capacity must be between 1 and 1000' });
    }

    // === Upload image to Cloudinary using buffer ===
    let imageUrl = null;
    if (req.file) {
      try {
        // Convert buffer to base64
        const b64 = req.file.buffer.toString('base64');
        let dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        // ✅ Use only timestamp for public_id to avoid any issues
        const publicId = `event_${Date.now()}`;
        
        console.log('Uploading event image with public_id:', publicId);
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'event-images',
          resource_type: 'image',
          public_id: publicId
        });
        
        imageUrl = result.secure_url;
        console.log('Event image uploaded to Cloudinary:', result.public_id);
        
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ error: 'Image upload failed: ' + uploadErr.message });
      }
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
  const { title, location, date, capacity, description } = req.body;
  await Event.findByIdAndUpdate(req.params.id, { title, location, date, capacity, description });
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

    // 2. Delete image from Cloudinary
    if (event.image) {
      try {
        const publicId = extractPublicIdFromUrl(event.image);
        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId);
          console.log('Cloudinary delete result:', result);
          if (result.result === 'ok') {
            console.log('Event image deleted from Cloudinary:', publicId);
          }
        }
      } catch (imgErr) {
        console.error('Image delete failed:', imgErr.message);
        // Continue with event deletion even if image delete fails
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

    // Delete profile image from Cloudinary
    if (user.profileImage && user.profileImage.includes('cloudinary')) {
      try {
        const publicId = extractPublicIdFromUrl(user.profileImage);
        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId);
          if (result.result === 'ok') {
            console.log('Profile image deleted from Cloudinary:', publicId);
          }
        }
      } catch (imgErr) {
        console.error('Profile image delete failed:', imgErr.message);
        // Continue with user deletion
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

exports.logoutAdmin = (req, res) => {
  try {
    res.clearCookie('token');
    return res.redirect('/login');
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).send('Server error');
  }
};

// Helper function to extract public_id from Cloudinary URL
function extractPublicIdFromUrl(url) {
  if (!url) return null;
  
  try {
    // Cloudinary URL format: 
    // https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
    // or https://res.cloudinary.com/cloud_name/image/upload/folder/filename.jpg
    
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload'
    let pathParts = parts.slice(uploadIndex + 1);
    
    // Remove version number if present (starts with 'v')
    if (pathParts[0] && pathParts[0].startsWith('v')) {
      pathParts = pathParts.slice(1);
    }
    
    // Join and remove any trailing spaces
    let publicId = pathParts.join('/').trim();
    
    // Remove file extension if present
    if (publicId.includes('.')) {
      const lastDotIndex = publicId.lastIndexOf('.');
      publicId = publicId.substring(0, lastDotIndex);
    }
    
    return publicId;
  } catch (err) {
    console.error('Error extracting public_id:', err);
    return null;
  }
}