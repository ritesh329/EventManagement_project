const admin = require('firebase-admin');

const config = require("../firebaseServiceAccount.json");
admin.initializeApp({
  credential: admin.credential.cert(config),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

module.exports = admin.storage().bucket();
