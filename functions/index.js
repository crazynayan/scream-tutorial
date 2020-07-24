const functions = require("firebase-functions")
const admin = require("firebase-admin")

admin.initializeApp()

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.getScreams = functions.https.onRequest(async (request, response) => {
  try {
    const snapshot = await admin.firestore().collection("screams").get()
    let screams = []
    snapshot.docs.forEach(doc => screams.push(doc.data()))
    response.send(screams)
  } catch (error) {
    console.error(error)
    response.status(500).send(error)
  }
})

exports.createScream = functions.https.onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(400).send({"error": "method not allowed"})
  }
  try {
    const newScream = {
      body: request.body.body,
      userHandle: request.body.userHandle,
      createdAt: admin.firestore.Timestamp.fromDate(new Date())
    }
    const doc = await admin.firestore().collection("screams").add(newScream)
    response.send({"message": `document ${doc.id} created successfully`})
  } catch (error) {
    console.error(error)
    response.status(500).send({"error": "error in creating scream"})
  }

})