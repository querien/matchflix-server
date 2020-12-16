const app = require("./app");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const Movienight = require("./models/Movienight.model");

// ℹ️ Sets the PORT for our app to have access to it. If no env has been set, we hard code it to 3000
const PORT = process.env.PORT || 5005;

const server = app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
const pseudoState = { usersInTheRoom: [] };
const io = socketio(server, {
  cors: { origin: process.env.ORIGIN || "http://localhost:3000" },
});

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("lookForData", (userData) => {
    pseudoState.roomID = userData.id;
    // socket.join(pseudoState.roomID);
    console.log("Id as sent to the server: ", userData.id);
    pseudoState.usersInTheRoom.push(userData.user);
    console.log(`Username: ${userData.user.username}, ID: ${userData.id}`);
    Movienight.findById(userData.id)
      .then((correctRoom) => {
        console.log(
          `Movies from the server: ${JSON.stringify(correctRoom.movieArray)}`
        );
        pseudoState.movieArray = correctRoom.movieArray;
      })
      .catch((err) => {
        console.log(`Error: ${err}`);
      });
    io.emit("dataFromServer", { ...pseudoState });
  });
  io.on("disconnect", () => {
    // socket.leave(pseudoState.roomID);
    console.log("User disconnected");
  });
});

// io.on("connection", (socket) => {
//   const myUser = JSON.parse(socket.handshake.query.myUser);

//   socket.join(socket.handshake.query.user);
//   const obj = Array.from(io.sockets.adapter.rooms).reduce((acc, [key, val]) => {
//     return { ...acc, [key]: val };
//   }, {});
//   console.log(obj.Querien2);
//   socket
//     .to(socket.handshake.query.user) //this is the room name
//     .emit(
//       "some event",
//       `There are ${
//         obj[socket.handshake.query.user].size
//       } people in this room, and ${myUser.username} just joined `
//     );

//   // console.log(`Client with id ${socket.id} connected`, socket);
//   socket.emit("user connected", { "connection happened": 12 });
// });
