const {db, admin, getImageUrl} = require("./utils")
const firebase = require("firebase")
const {firebaseConfig} = require("./secrets")
firebase.initializeApp(firebaseConfig)
const {uuid} = require("uuidv4")

exports.signup = async (request, response) => {
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
    return response.status(400).send(errors)
  try {
    const doc = await db.doc(`/users/${newUser.handle}`).get()
    if (doc.exists)
      return response.status(400).send({handle: "this handle is already taken"})
    const data = await firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
    const token = await data.user.getIdToken()
    const userCredentials = {
      handle: newUser.handle,
      email: newUser.email,
      createdAt: new Date().toISOString(),
      userId: data.user.uid,
      imageUrl: getImageUrl("blank.jpg", "9f8fcdf9-9325-47c7-8b37-8807472dfe8b")
    }
    await db.doc(`/users/${newUser.handle}`).set(userCredentials)
    response.status(201).send({token})
  } catch (error) {
    console.error(error)
    if (error.code === "auth/email-already-in-use")
      return response.status(400).send({email: error.message})
    response.status(500).send({error: error.code})
  }
}

exports.login = async (request, response) => {
  const user = {...request.body}
  let errors = {}
  if (user.email.trim() === "")
    errors.email = "Must not be empty"
  if (user.password.trim() === "")
    errors.password = "Must not be empty"
  if (Object.keys(errors).length > 0)
    return response.send(errors)
  try {
    const data = await firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    const token = await data.user.getIdToken()
    response.send({token})
  } catch (error) {
    console.error(error)
    if (error.code === "auth/wrong-password")
      return response.status(403).send({general: "Wrong credentials, please try again"})
    response.status(500).send({error: error.code})
  }
}

exports.addUserDetails = async (request, response) => {
  let userDetails = {...request.body}
  if (!userDetails.website.startsWith("http")) {
    userDetails.website = `http://${userDetails.website}`
  }
  try {
    await db.doc(`/users/${request.user.handle}`).update(userDetails)
    response.send({message: "user details updated successfully"})
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }
}

exports.getAuthenticatedUser = async (request, response) => {
  let userDetails = {
    credentials: request.user.credentials,
    likes: []
  }
  try {
    const docs = await db.collection("likes").where("userHandle", "==", request.user.handle).get()
    docs.forEach(doc => {
      userDetails.likes.push(doc.data())
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