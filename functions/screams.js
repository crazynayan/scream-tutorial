const {db} = require("./utils")

exports.getAllScreams = async(request, response) => {
  try {
    const snapshot = await db.collection("screams").orderBy("createdAt", "desc").get()
    let screams = []
    snapshot.docs.forEach(doc => screams.push({screamId: doc.id, ...doc.data()}))
    response.send(screams)
  } catch (error) {
    console.error(error)
    response.status(500).send(error)
  }
}

exports.postOneScream = async (request, response) => {
  try {
    const newScream = {...request.body}
    newScream.userHandle = request.user.handle
    newScream.createdAt = new Date().toISOString()
    newScream.imageUrl = request.user.credentials.imageUrl
    newScream.likeCount = 0
    newScream.commentCount = 0
    const doc = await db.collection("screams").add(newScream)
    newScream.screamId = doc.id
    response.status(201).send(newScream)
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }
}

exports.getScream = async(request, response) => {
  let screamData = {}
  try {
    const doc = await db.doc(`/screams/${request.params.screamId}`).get()
    if (!doc.exists)
      return response.status(404).send({error: "scream not found"})
    screamData = doc.data()
    screamData.screamId = doc.id
    const docs = await db.collection("/comments").where("screamId", "==", doc.id).orderBy("createdAt", "desc").get()
    screamData.comments = []
    docs.forEach(doc => {screamData.comments.push(doc.data())})
    response.send(screamData)
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }

}

exports.commentOnScream = async(request, response) => {
  try {
    const doc = await db.doc(`/screams/${request.params.screamId}`).get()
    if (!doc.exists)
      return response.status(404).send({error: "scream not found"})
    const newComment = {...request.body}
    newComment.createdAt = new Date().toISOString()
    newComment.screamId = request.params.screamId
    newComment.userHandle = request.user.handle
    newComment.imageUrl = request.user.credentials.imageUrl
    await db.collection("comments").add(newComment)
    await db.doc(`/screams/${request.params.screamId}`).update({commentCount: doc.data().commentCount + 1})
    response.status(201).send(newComment)
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }
}