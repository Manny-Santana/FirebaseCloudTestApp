const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const app = express();

admin.initializeApp();
const Scream = admin.firestore().collection("screams");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   response.send("Hello from Firebase!");
// });

app.get("/screams", (req, res) => {
  Scream.orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamID: doc.id,
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          userHandle: doc.data().userHandle
        });
      });
      return res.json(screams);
    })
    .catch(err => console.err(err));
});

// exports.getScreams = functions.https.onRequest((req, res) => {

// });

app.post("/scream", (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
    // createdAt: admin.firestore.Timestamp.fromDate(new Date())
  };

  Scream.add(newScream)
    .then(doc => {
      res
        .status(200)
        .json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.log(err);
    });
});

// exports.createScream = functions.https.onRequest((req, res) => {

// });

exports.api = functions.https.onRequest(app);
