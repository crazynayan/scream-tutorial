const admin = require("firebase-admin")
admin.initializeApp()
const db = admin.firestore()

const authentication = async(request, response, next) => {
  if (!request.headers || !request.headers.authorization.startsWith("Bearer ")) {
    console.error("No token found")
    response.status(403).send({error: "Unauthorized"})
  }
  const idToken = request.headers.authorization.split(" ")[1]
  try {
    request.user = await admin.auth().verifyIdToken(idToken)
    const data = await db.collection("users").where("userId", "==", request.user.uid).limit(1).get()
    request.user.handle = data.docs[0].data().handle
    console.log(request.user)
    return next()
  } catch(error) {
    console.error("Error while verifying token ", error)
    response.status(403).send(error)
  }
}

module.exports = {db, authentication}