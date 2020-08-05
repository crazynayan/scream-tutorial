const {db} = require("./utils")

exports.getAllScreams = async (request, response) => {
  try {
    const snapshot = await db.collection("screams").orderBy("createdAt", "desc").get()
    let screams = []
    snapshot.docs.forEach(doc => screams.push({screamId: doc.id, ...doc.data()}))
    response.send(screams)
  } catch (error) {
    console.error(error)
    response.status(500).send(error.code)
  }
}

exports.postOneScream = (request, response) => {
  const newScream = {...request.body}
  if (!newScream.body || newScream.body.trim() === "")
    return response.status(400).send({body: "must not be empty"})
  newScream.userHandle = request.user.handle
  newScream.createdAt = new Date().toISOString()
  newScream.imageUrl = request.user.credentials.imageUrl
  newScream.likeCount = 0
  newScream.commentCount = 0;
  (async() => {
    try {
      const doc = await db.collection("screams").add(newScream)
      newScream.screamId = doc.id
      return response.send(newScream)
    } catch (error) {
      console.error(error)
      return response.status(500).send({error: error.code})
    }
  })()
}

exports.getScream = async (request, response) => {
  let screamData = {}
  try {
    const doc = await db.doc(`/screams/${request.params.screamId}`).get()
    if (!doc.exists)
      return response.status(404).send({error: "scream not found"})
    screamData = doc.data()
    screamData.screamId = doc.id
    const docs = await db.collection("/comments").where("screamId", "==", doc.id).orderBy("createdAt", "desc").get()
    screamData.comments = []
    docs.forEach(doc => {
      screamData.comments.push(doc.data())
    })
    response.send(screamData)
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }

}

exports.commentOnScream = (request, response) => {
  const newComment = {...request.body}
  if (!newComment.body || newComment.body.trim() === "")
    return response.status(400).send({body: "must not be empty"})
  newComment.createdAt = new Date().toISOString()
  newComment.screamId = request.params.screamId
  newComment.userHandle = request.user.handle
  newComment.imageUrl = request.user.credentials.imageUrl;
  (async() => {
    try {
      const screamDoc = await db.doc(`/screams/${request.params.screamId}`).get()
      if (!screamDoc.exists)
        return response.status(404).send({body: "scream not found"})
      await screamDoc.ref.update({commentCount: screamDoc.data().commentCount + 1})
      await db.collection("comments").add(newComment)
      response.send(newComment)
    } catch (error) {
      console.error(error)
      response.status(500).send({body: error.code})
    }
  })()
}

exports.likeScream = async (request, response) => {
  try {
    const screamDoc = await db.doc(`/screams/${request.params.screamId}`).get()
    if (!screamDoc.exists)
      return response.status(404).send({error: "scream not found"})
    const data = await db.collection("likes").where("userHandle", "==", request.user.handle).where("screamId", "==", request.params.screamId).limit(1).get()
    if (!data.empty)
      return response.status(400).send({error: "scream already liked"})
    let scream = screamDoc.data()
    scream.screamId = screamDoc.id
    scream.likeCount += 1
    await screamDoc.ref.update({likeCount: scream.likeCount})
    await db.collection("likes").add({userHandle: request.user.handle, screamId: request.params.screamId})
    response.send(scream)
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }
}

exports.unlikeScream = async (request, response) => {
  try {
    const data = await db.collection("likes").where("userHandle", "==", request.user.handle).where("screamId", "==", request.params.screamId).limit(1).get()
    if (data.empty)
      return response.status(400).send({error: "scream is not liked"})
    const screamDoc = await db.doc(`/screams/${request.params.screamId}`).get()
    if (!screamDoc.exists)
      return response.status(404).send({error: "scream not found"})
    let scream = screamDoc.data()
    scream.screamId = screamDoc.id
    scream.likeCount -= 1
    await screamDoc.ref.update({likeCount: scream.likeCount})
    await db.doc(`/likes/${data.docs[0].id}`).delete()
    response.send(scream)
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }
}

exports.deleteScream = async (request, response) => {
  try {
    const screamDoc = await db.doc(`/screams/${request.params.screamId}`).get()
    if (!screamDoc.exists)
      return response.status(404).send({error: "scream not found"})
    if (screamDoc.data().userHandle !== request.user.handle)
      return response.status(403).send({error: "unauthorized"})
    await screamDoc.ref.delete()
    response.send({ message: "scream deleted successfully" })
  } catch (error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }
}


exports.onDelete = async(screamId) => {
  const batch = db.batch()
  try {
    const commentCol = await db.collection("comments").where("screamId", "==", screamId).get()
    commentCol.docs.forEach(doc => {
      batch.delete(db.doc(`/comments/${doc.id}`))
    })
    const likeCol = await db.collection("likes").where("screamId", "==", screamId).get()
    likeCol.docs.forEach(doc => {
      batch.delete(db.doc(`/likes/${doc.id}`))
    })
    const notificationCol = await db.collection("notifications").where("screamId", "==", screamId).get()
    notificationCol.docs.forEach(doc => {
      batch.delete(db.doc(`/notifications/${doc.id}`))
    })
    await batch.commit()
  } catch(error) {
    console.error(error)
  }
}
