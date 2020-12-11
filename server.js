const app = require("./app");
const socketio = require("socket.io");

// ℹ️ Sets the PORT for our app to have access to it. If no env has been set, we hard code it to 3000
const PORT = process.env.PORT || 5005;

const server = app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});

const io = socketio(server, {
  cors: { origin: process.env.ORIGIN || "http://localhost:3000" },
});

io.on("connection", (socket) => {
  const myUser = JSON.parse(socket.handshake.query.myUser);

  socket.join(socket.handshake.query.user);
  const obj = Array.from(io.sockets.adapter.rooms).reduce((acc, [key, val]) => {
    return { ...acc, [key]: val };
  }, {});
  console.log(obj.Querien2);
  socket
    .to(socket.handshake.query.user) //this is the room name
    .emit(
      "some event",
      `There are ${
        obj[socket.handshake.query.user].size
      } people in this room, and ${myUser.username} just joined `
    );

  // console.log(`Client with id ${socket.id} connected`, socket);
  socket.emit("user connected", { "connection happened": 12 });
});

// io.on(‘connection’, (socket) => {
//   console.log(`Client with id ${socket.id} connected`)
//   clients.push(socket.id)
//   socket.emit(‘message’, “I’m server”)
//   socket.on(‘message’, (message) =>
//     console.log(‘Message: ’, message)
//   )
//   socket.on(‘disconnect’, () => {
//     clients.splice(clients.indexOf(socket.id), 1)
//     console.log(`Client with id ${socket.id} disconnected`)
//   })
// })
// app.use(express.static(__dirname))
// app.get(‘/’, (req, res) => res.render(‘index’))

// //получение количества активных клиентов
// app.get(‘/clients-count’, (req, res) => {
//   res.json({
//     count: io.clients().server.engine.clientsCount,
//   })
// })
// //отправка сообщения конкретному клиенту по его id
// app.post(‘/client/:id’, (req, res) => {
//   if (clients.indexOf(req.params.id) !== -1) {
//     io.sockets.connected[req.params.id].emit(
//       ‘private message’,
//       `Message to client with id ${req.params.id}`
//     )
//     return res
//       .status(200)
//       .json({
//         message: `Message was sent to client with id ${req.params.id}`,
//       })
//   } else
//     return res
//       .status(404)
//       .json({ message: ‘Client not found’ })
// })
// http.listen(port, host, () =>
//   console.log(`Server listens http://${host}:${port}`)
// )
