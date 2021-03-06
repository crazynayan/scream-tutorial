const db = {
  users: [
    {
      userId: "rDTHKYnR2HX3NqDKUhmVsu1JeTD3",
      email: "user@example.com",
      handle: "user",
      createdAt: "2020-07-24T08:35:08.050Z",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/scream-tutorial.appspot.com/o/blank.jpg?alt=media&token=f8fcdf9-9325-47c7-8b37-8807472dfe8b",
      bio: "Hello, my name is user",
      website: "http://user.com",
      location: "Mumbai, India"
    }
  ],
  screams: [
    {
      userHandle: "user",
      body: "this is a scream",
      createdAt: "2020-07-24T08:35:08.050Z",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/scream-tutorial.appspot.com/o/blank.jpg?alt=media&token=f8fcdf9-9325-47c7-8b37-8807472dfe8b",
      likeCount: 5,
      commentCount: 2
    }
  ],
  comments: [
    {
      userHandle: "user",
      screamId: "kd8KYnR2HX3NqDKUhmVsu1JeTD3",
      body: "nice one mate",
      createdAt: "2020-07-24T08:35:08.050Z",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/scream-tutorial.appspot.com/o/blank.jpg?alt=media&token=f8fcdf9-9325-47c7-8b37-8807472dfe8b",
    }
  ],
  likes: [
    {
      userHandle: "user",
      screamId: "kd8KYnR2HX3NqDKUhmVsu1JeTD3",
    }
  ],
  notifications: [
    {
      recipient: "user",
      sender: "john",
      read: "true | false",
      screamId: "kd8KYnR2HX3NqDKUhmVsu1JeTD3",
      type: "like | comment",
      createdAt: "2020-07-24T08:35:08.050Z"
    }
  ]
}

const userDetails ={
  // Redux data
  credentials: {
    userId: "rDTHKYnR2HX3NqDKUhmVsu1JeTD3",
    email: "user@example.com",
    handle: "user",
    createdAt: "2020-07-24T08:35:08.050Z",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/scream-tutorial.appspot.com/o/blank.jpg?alt=media&token=f8fcdf9-9325-47c7-8b37-8807472dfe8b",
    bio: "Hello, my name is user",
    website: "http://user.com",
    location: "Mumbai, India"
  },
  likes: [
    {
      userHandle: "user",
      screamId: "hh7O5WfWWucVZGbHH2pa"
    },
    {
      userHandle: "user",
      screamId: "3I7OUWfW23cVZGbHH2XO"
    }
  ],
  notifications: [
    {
      recipient: "user",
      sender: "john",
      read: "true | false",
      screamId: "kd8KYnR2HX3NqDKUhmVsu1JeTD3",
      type: "like | comment",
      createdAt: "2020-07-24T08:35:08.050Z",
      notificationId: "X97O5WfWWucVZGbL32pa"
    }
  ]
}