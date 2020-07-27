const functions = require("firebase-functions")

const app = require("express")()

const {authentication} = require("./utils")
const {getAllScreams, postOneScream, getScream, commentOnScream} = require("./screams")
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser} = require("./users")

// Authentication routes
app.post("/signup", signup)
app.post("/login", login)

// User routes
// noinspection JSCheckFunctionSignatures
app.post("/user/image", authentication, uploadImage)
// noinspection JSCheckFunctionSignatures
app.post("/user", authentication, addUserDetails)
// noinspection JSCheckFunctionSignatures
app.get("/user", authentication, getAuthenticatedUser)


// Scream routes
app.get("/screams", getAllScreams)
// noinspection JSCheckFunctionSignatures
app.post("/scream", authentication , postOneScream)
// TODO getScream, commentOnScream, deleteScream, likeScream,
app.get("/screams/:screamId", getScream)
// noinspection JSCheckFunctionSignatures
app.post("/scream/:screamId/post", authentication , commentOnScream)


exports.api = functions.region("us-central1").https.onRequest(app)
