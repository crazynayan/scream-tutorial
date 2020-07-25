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
}