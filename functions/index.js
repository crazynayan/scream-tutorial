const functions = require("firebase-functions")

const app = require("express")()

const {authentication} = require("./utils")
const {getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream} = require("./screams")
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
app.get("/scream/:screamId", getScream)
// noinspection JSCheckFunctionSignatures
app.post("/scream/:screamId/comment", authentication , commentOnScream)
// noinspection JSCheckFunctionSignatures
app.post("/scream/:screamId/like", authentication , likeScream)
// noinspection JSCheckFunctionSignatures
app.post("/scream/:screamId/unlike", authentication , unlikeScream)
// noinspection JSCheckFunctionSignatures
app.delete("/scream/:screamId", authentication , deleteScream)


exports.api = functions.region("us-central1").https.onRequest(app)
