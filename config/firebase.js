const firebase = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "..", "google.json"));

const app = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

const storage = firebase.storage(app);

module.exports = { firebase, storage };
