const functions = require("firebase-functions")
const admin = require("firebase-admin")

admin.initializeApp()

const express = require("express")
const app = express()

app.get("/screams", async(request, response) => {
  try {
    const snapshot = await admin.firestore().collection("screams").orderBy("createdAt", "desc").get()
    let screams = []
    snapshot.docs.forEach(doc => screams.push({screamId: doc.id, ...doc.data()}))
    response.send(screams)
  } catch (error) {
    console.error(error)
    response.status(500).send(error)
  }
})

app.post("/scream",async (request, response) => {
  try {
    const newScream = {
      body: request.body.body,
      userHandle: request.body.userHandle,
      createdAt: new Date().toISOString()
    }
    const doc = await admin.firestore().collection("screams").add(newScream)
    response.send({"message": `document ${doc.id} created successfully`})
  } catch (error) {
    console.error(error)
    response.status(500).send({"error": "error in creating scream"})
  }
})

exports.api = functions.region("us-central1").https.onRequest(app)
