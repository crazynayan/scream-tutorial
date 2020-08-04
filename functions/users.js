const {db, admin, getImageUrl} = require("./utils")
const firebase = require("firebase")
const {firebaseConfig} = require("./secrets")
firebase.initializeApp(firebaseConfig)
const {uuid} = require("uuidv4")
const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

exports.signup = (request, response) => {
  const user = {...request.body}
  let errors = {}
  if (!user)
    return response.status(400).send({email: "Invalid request, please try again"})
  if (!user || user.email.trim() === "")
    errors.email = "must not be empty"
  else if (!user.email.match(emailRegEx))
    errors.email = "must be a valid email address"
  if (user.password.trim() === "")
    errors.password = "must not be empty"
  if (user.password.length < 6)
    errors.password = "must be at least 6 characters"
  if (user.password !== user.confirmPassword)
    errors.confirmPassword = "passwords must match"
  if (user.handle.trim() === "")
    errors.handle = "must not be empty"
  if (Object.keys(errors).length > 0)
    return response.status(400).send(errors)
  return (async () => {
    try {
      const doc = await db.doc(`/users/${user.handle}`).get()
      if (doc.exists)
        return response.status(400).send({handle: "this handle is already taken"})
      const data = await firebase.auth().createUserWithEmailAndPassword(user.email, user.password)
      const token = await data.user.getIdToken()
      await db.doc(`/users/${user.handle}`).set({
        handle: user.handle,
        email: user.email,
        createdAt: new Date().toISOString(),
        userId: data.user.uid,
        imageUrl: getImageUrl("blank.jpg", "9f8fcdf9-9325-47c7-8b37-8807472dfe8b")
      })
      return response.send({token})
    } catch (error) {
      console.error(error)
      if (error.code === "auth/email-already-in-use")
        return response.status(400).send({email: error.message})
      return response.status(500).send({email: "Something went wrong, please try again"})
    }
  })()
}

exports.login = (request, response) => {
  const user = {...request.body}
  let errors = {}
  if (user) {
    if (!user.email || user.email.trim() === "")
      errors.email = "must not be empty"
    else if (!user.email.match(emailRegEx))
      errors.email = "must be a valid email address with the @ sign"
    if (!user.password || user.password.trim() === "")
      errors.password = "must not be empty"
  } else {
    errors.password = "invalid request format"
  }
  if (Object.keys(errors).length > 0)
    return response.status(400).send(errors)
  return (async () => {
    try {
      const data = await firebase.auth().signInWithEmailAndPassword(user.email, user.password)
      const token = await data.user.getIdToken()
      return response.send({token})
    } catch (error) {
      return response.status(403).send({password: "Wrong credentials, please try again"})
    }
  })()
}

exports.addUserDetails = async (request, response) => {
  let userDetails = {...request.body}
  if (!userDetails.website || userDetails.website.trim() === "")
    userDetails.website = ""
  if (!userDetails.bio || userDetails.bio.trim() === "")
    userDetails.bio = ""
  if (!userDetails.location || userDetails.location.trim() === "")
    userDetails.location = ""
  if (!!userDetails.website && !userDetails.website.startsWith("http")) {
    userDetails.website = `http://${userDetails.website}`
  }
  try {
    const userRef = db.doc(`/users/${request.user.handle}`)
    await userRef.update(userDetails)
    const userDoc = await userRef.get()
    return response.send({...userDoc.data()})
  } catch (error) {
    console.error(error)
    return response.status(500).send({error: error.code})
  }
}

exports.getAuthenticatedUser = async (request, response) => {
  let userDetails = {
    credentials: request.user.credentials,
    likes: [],
    notifications: []
  }
  try {
    const likeDocs = await db.collection("likes").where("userHandle", "==", request.user.handle).get()
    likeDocs.forEach(doc => {
      userDetails.likes.push(doc.data())
    })
    const notificationCol = await db.collection("notifications")
      .where("recipient", "==", request.user.handle)
      .orderBy("createdAt", "desc").limit(10).get()
    notificationCol.docs.forEach(doc => {
      const notification = {...doc.data()}
      notification.notificationId = doc.id
      userDetails.notifications.push(notification)
    })
    response.send(userDetails)
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }
}

exports.getUserDetails = async (request, response) => {
  let userDetails = {
    user: {},
    screams: []
  }
  try {
    const userDoc = await db.doc(`/users/${request.params.handle}`).get()
    if (!userDoc.exists)
      return response.status(404).send({error: "user not found"})
    userDetails.user = userDoc.data()
    const screamCol = await db.collection("screams")
      .where("userHandle", "==", request.params.handle)
      .orderBy("createdAt", "desc").get()
    screamCol.docs.forEach(doc => {
      const scream = doc.data()
      scream.screamId = doc.id
      userDetails.screams.push(scream)
    })
    response.send(userDetails)
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }
}

exports.uploadImage = async (request, response) => {
  const BusBoy = require("busboy")
  const busboy = new BusBoy({headers: request.headers})
  let image = {}

  // noinspection JSUnresolvedFunction
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (!["image/jpeg", "image/png"].includes(mimetype))
      response.status(400).send({error: "Only jpeg and png are allowed for upload"})
    const imageExtension = filename.split(".").pop()
    image.filename = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`
    image.filepath = require("path").join(require("os").tmpdir(), image.filename)
    image.mimeType = mimetype
    image.token = uuid()
    file.pipe(require("fs").createWriteStream(image.filepath))
  })
  // noinspection JSUnresolvedFunction
  busboy.on("finish", async () => {
    const uploadOptions = {
      resumable: false,
      metadata: {
        metadata: {
          contentType: image.mimeType,
          firebaseStorageDownloadTokens: image.token
        }
      }
    }
    try {
      await admin.storage().bucket().upload(image.filepath, uploadOptions)
      image.url = getImageUrl(image.filename, image.token)
      await db.doc(`/users/${request.user.handle}`).update({imageUrl: image.url})
      response.send({message: "image uploaded successfully"})
    } catch (error) {
      console.error(error)
      response.status(500).send({error: error.code})
    }
  })
  // noinspection JSUnresolvedFunction
  busboy.end(request.rawBody)
}

exports.onImageChange = async (userChange) => {
  if (userChange.before.data().imageUrl === userChange.after.data().imageUrl)
    return
  const batch = db.batch()
  try {
    const screamCol = await db.collection("screams").where("userHandle", "==", userChange.before.data().handle).get()
    screamCol.docs.forEach(doc => {
      batch.update(db.doc(`/screams/${doc.id}`), {imageUrl: userChange.after.data().imageUrl})
    })
    const commentCol = await db.collection("comments").where("userHandle", "==", userChange.before.data().handle).get()
    commentCol.docs.forEach(doc => {
      batch.update(db.doc(`/comments/${doc.id}`), {imageUrl: userChange.after.data().imageUrl})
    })
    await batch.commit()
  } catch (error) {
    console.error(error)
  }
}