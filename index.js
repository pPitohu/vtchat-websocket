const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const {
  registerUser,
  setOnlineStatus,
  sendAllUsers,
} = require('./services/user');
const {
  connectToChat,
  initChat,
  getChats,
  insertMessage,
  changeIsTyping,
} = require('./services/chat');
const { io, server, app } = require('./io');

const {
  INIT_CHAT,
  CHAT_MESSAGE,
  CONNECT_TO_CHAT,
  USER_TYPING,
} = require('./constants');

require('dotenv').config();

const port = process.env.PORT || 1111;

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

app.get('/ping', (req, res) => {
  res.send('server is working');
});

io.on('connection', (socket) => {
  const { username, id, rank } = socket.handshake.auth;
  console.log('Client connected', { username, id, rank });

  // register user and set online status to true
  registerUser(socket, { username, id, rank });
  setOnlineStatus({ username, id }, true);
  sendAllUsers(socket);
  getChats(socket, username);
  socket.join(id);

  socket.on(
    CONNECT_TO_CHAT,
    async (chatInfo) => await connectToChat(socket, chatInfo)
  );

  socket.on(
    INIT_CHAT,
    async ({ sender, reciever }) => await initChat(socket, sender, reciever)
  );

  socket.on(CHAT_MESSAGE, async (msg) => await insertMessage(socket, msg));

  socket.on(
    USER_TYPING,
    async (chatInfo) => await changeIsTyping(socket, chatInfo)
  );

  socket.on('disconnect', async () =>
    handleDisconnect(socket, { username, id, rank })
  );
  socket.on('error', function (err) {
    console.log(err);
  });
});

const handleDisconnect = async (socket, { username, id, rank }) => {
  const sockets = await io.in(id).fetchSockets();
  if (sockets.length === 0) {
    // set user to offline
    socket.room = undefined;
    console.log('Client disconnected', { username, id, rank }, socket.rooms);
    setOnlineStatus({ username, id }, false);
  }
};

server.listen(port, () => {
  console.log('Server started. Port: ', port);
  mongoose.connect(process.env.DB_NAME, { useNewUrlParser: true }, () =>
    console.log('Connected to database')
  );
});
