const functions = require("firebase-functions")

const app = require("express")()

const {authentication} = require("./utils")
const {getAllScreams, postOneScream} = require("./screams")
const {signup, login, uploadImage} = require("./users")

// Authentication routes
app.post("/signup", signup)
app.post("/login", login)
// noinspection JSCheckFunctionSignatures
app.post("/user/image", authentication, uploadImage)

// Scream routes
app.get("/screams", getAllScreams)
// noinspection JSCheckFunctionSignatures
app.post("/scream", authentication , postOneScream)

exports.api = functions.region("us-central1").https.onRequest(app)
