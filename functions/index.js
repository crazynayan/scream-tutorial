const functions = require("firebase-functions")

const app = require("express")()

const cors = require("cors")
app.use(cors())

const {authentication} = require("./utils")
const {getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream, onDelete} = require("./screams")
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, onImageChange} = require("./users")
const {createOnLike, deleteOnUnlike, createOnComment, markNotificationsRead} = require("./notifications")

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
app.get("/user/:handle", getUserDetails)

// Scream routes
app.get("/screams", getAllScreams)
// noinspection JSCheckFunctionSignatures
app.post("/scream", authentication, postOneScream)
app.get("/scream/:screamId", getScream)
// noinspection JSCheckFunctionSignatures
app.post("/scream/:screamId/comment", authentication, commentOnScream)
// noinspection JSCheckFunctionSignatures
app.post("/scream/:screamId/like", authentication, likeScream)
// noinspection JSCheckFunctionSignatures
app.post("/scream/:screamId/unlike", authentication, unlikeScream)
// noinspection JSCheckFunctionSignatures
app.delete("/scream/:screamId", authentication, deleteScream)


// Notification Routes
// noinspection JSCheckFunctionSignatures
app.post("/notifications", authentication, markNotificationsRead)


// API Functions
exports.api = functions.region("us-central1").https.onRequest(app)


// Notification - Trigger Functions
exports.createNotificationOnLike = functions.region("us-central1").firestore
  .document("/likes/{id}").onCreate(async (doc) => {
    await createOnLike(doc)
  })

exports.deleteNotificationOnUnlike = functions.region("us-central1").firestore
  .document("/likes/{id}").onDelete(async (doc) => {
    await deleteOnUnlike(doc)
  })

exports.createNotificationOnComment = functions.region("us-central1").firestore
  .document("/comments/{id}").onCreate(async (doc) => {
    await createOnComment(doc)
  })

// User - Trigger Function
exports.onUserImageChange = functions.region("us-central1").firestore
  .document("/users/{id}").onUpdate( async(change) => {
    await onImageChange(change)
  })

// Scream - Trigger Function
exports.onScreamDelete = functions.region("us-central1").firestore
  .document("/screams/{screamId}").onDelete( async(doc, context) => {
    await onDelete(context.params.screamId)
  })
