const {db} = require("./utils")


exports.markNotificationsRead = async (request, response) => {
  let batch = db.batch()
  request.body.forEach(notificationId => {
    batch.update(db.doc(`/notifications/${notificationId}`), {required: true})
  })
  try {
    await batch.commit()
    response.send({message: "notifications marked read"})
  } catch(error) {
    console.error(error)
    response.status(500).send({error: error.code})
  }
}


exports.createOnLike = async(likeDoc) => {
  try {
    const screamDoc = await db.doc(`/screams/${likeDoc.data().screamId}`).get()
    if (!screamDoc.exists) {
      console.error({error: "scream not found for creating notification on like"})
      return
    }
    await db.doc(`/notifications/${likeDoc.id}`).set({
      recipient: screamDoc.data().userHandle,
      sender: likeDoc.data().userHandle,
      read: false,
      screamId: screamDoc.id,
      type: "like",
      createdAt: new Date().toISOString()
    })
  } catch(error) {
    console.error(error)
  }
}

exports.deleteOnUnlike = async(likeDoc) => {
  try {
    await db.doc(`/notifications/${likeDoc.id}`).delete()
  } catch(error) {
    console.error(error)
  }
}


exports.createOnComment = async (commentDoc) => {
  try {
    const screamDoc = await db.doc(`/screams/${commentDoc.data().screamId}`).get()
    if (!screamDoc.exists) {
      console.error({error: "scream not found for creating notification on comment"})
      return
    }
    await db.doc(`/notifications/${commentDoc.id}`).set({
      recipient: screamDoc.data().userHandle,
      sender: commentDoc.data().userHandle,
      read: false,
      screamId: screamDoc.id,
      type: "comment",
      createdAt: new Date().toISOString()
    })
  } catch(error) {
    console.error(error)
  }
}
