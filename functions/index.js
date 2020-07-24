const functions = require("firebase-functions")
const admin = require("firebase-admin")
admin.initializeApp()
const db = admin.firestore()
const app = require("express")()

const firebase = require("firebase")
const {firebaseConfig} = require("./secrets")
firebase.initializeApp(firebaseConfig)

const authentication = async(request, response, next) => {
  if (!request.headers || !request.headers.authorization.startsWith("Bearer ")) {
    console.error("No token found")
    response.status(403).send({error: "Unauthorized"})
  }
  const idToken = request.headers.authorization.split(" ")[1]
  try {
    request.user = await admin.auth().verifyIdToken(idToken)
    const data = await db.collection("users").where("userId", "==", request.user.uid).limit(1).get()
    request.user.handle = data.docs[0].data().handle
    console.log(request.user)
    return next()
  } catch(error) {
    console.error("Error while verifying token ", error)
    response.status(403).send(error)
  }
}

app.get("/screams", async(request, response) => {
  try {
    const snapshot = await db.collection("screams").orderBy("createdAt", "desc").get()
    let screams = []
    snapshot.docs.forEach(doc => screams.push({screamId: doc.id, ...doc.data()}))
    response.send(screams)
  } catch (error) {
    console.error(error)
    response.status(500).send(error)
  }
})

// noinspection JSCheckFunctionSignatures
app.post("/scream", authentication , async (request, response) => {
  try {
    // noinspection JSUnresolvedVariable
    const newScream = {
      body: request.body.body,
      userHandle: request.user.handle,
      createdAt: new Date().toISOString()
    }
    const doc = await db.collection("screams").add(newScream)
    response.send({message: `document ${doc.id} created successfully`})
  } catch (error) {
    console.error(error)
    response.status(500).send({error: "error in creating scream"})
  }
})

app.post("/signup", async(request, response) => {
  const newUser = {...request.body}
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  let errors = {}
  if (newUser.email.trim() === "")
    errors.email = "Must not be empty"
  else if (!newUser.email.match(emailRegEx))
    errors.email = "Must be a valid email address"
  if (newUser.password.trim() === "")
    errors.password = "Must not be empty"
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "Passwords must match"
  if (newUser.handle.trim() === "")
    errors.handle = "Must not be empty"
  if (Object.keys(errors).length > 0)
    response.status(400).send(errors)
  try {
    const doc = await db.doc(`/users/${newUser.handle}`).get()
    if (doc.exists) {
      response.status(400).send({handle: "this handle is already taken"})
    }
    const data = await firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
    const token = await data.user.getIdToken()
    const userCredentials = {
      handle: newUser.handle,
      email: newUser.email,
      createdAt: new Date().toISOString(),
      userId: data.user.uid
    }
    await db.doc(`/users/${newUser.handle}`).set(userCredentials)
    response.status(201).send({token})
  } catch (error) {
    console.error(error)
    if (error.code === "auth/email-already-in-use")
      response.status(400).send({email: error.message})
    response.status(500).send({error: error.code})
  }
})

app.post("/login", async(request, response) => {
  const user = {...request.body}
  let errors = {}
  if (user.email.trim() === "")
    errors.email = "Must not be empty"
  if (user.password.trim() === "")
    errors.password = "Must not be empty"
  if (Object.keys(errors).length > 0)
    response.send({errors})
  try {
    const data = await firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    const token = await data.user.getIdToken()
    response.send({token})
  } catch (error) {
    console.error(error)
    if (error.code === "auth/wrong-password")
      response.status(403).send({general: "Wrong credentials, please try again"})
    response.status(500).send({error: error.code})
  }
})

exports.api = functions.region("us-central1").https.onRequest(app)
