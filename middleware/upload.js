const multer = require('multer');

// Memory storage (Firebase upload)
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
