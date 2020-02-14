const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const app = express();
const firebase = require("firebase");
require("dotenv").config();

admin.initializeApp();

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "test-c0525.firebaseapp.com",
  databaseURL: "https://test-c0525.firebaseio.com",
  projectId: "test-c0525",
  storageBucket: "test-c0525.appspot.com",
  messagingSenderId: "433534693802",
  appId: "1:433534693802:web:bb6a5b22c358a9d4c73bd3",
  measurementId: "G-8BVNHJTMXP"
};
firebase.initializeApp(firebaseConfig);
const Scream = admin.firestore().collection("screams");
const db = admin.firestore();

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

// Signup route
// validation helper function
const isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};
const isEmail = email => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  else return false;
};

app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };
  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "email must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "must be a valid email address";
  }

  // password validation
  if (isEmpty(newUser.password)) errors.password = "must not be empty";

  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "Passwords must match";

  // user handle empty validation
  if (isEmpty(newUser.handle)) errors.handle = "must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);
  // TODO: validate data
  //make sure email is not empty
  //make sure password and confirm match

  let token, userId;

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "email is already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

exports.api = functions.https.onRequest(app);
