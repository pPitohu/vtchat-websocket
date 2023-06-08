const {
  GET_CHATS,
  NEW_CHAT,
  EXISTING_CHAT,
  NEW_MESSAGE,
  USER_TYPING,
} = require('../constants');
const { io } = require('../io');
const Chat = require('../models/Chat');
const uuid = require('uuid');

const connectToChat = async (socket, { chatId }) => {
  try {
    console.log('leaving room', socket.room);
    socket.leave(socket.room);

    socket.room = chatId;
    await socket.join(chatId);
    console.log(
      `connecting ${socket.id} to ${chatId}`,
      await io.in(chatId).allSockets()
    );

    return true;
  } catch (e) {
    console.log('ERROR in connectToChat:', e.message);
    return false;
  }
};

const initChat = async (socket, sender, reciever) => {
  try {
    const chat = await Chat.findOne(
      {
        $or: [
          {
            $and: [
              { 'members.username': sender.username },
              { 'members.username': reciever.username },
            ],
          },
          {
            $and: [
              { 'members.username': reciever.username },
              { 'members.username': sender.username },
            ],
          },
        ],
      },
      '-__v'
    );
    if (!chat) {
      const newChat = await new Chat(
        {
          members: [sender, reciever],
        },
        '-__v'
      ).save();
      socket.emit(NEW_CHAT, newChat);
    } else socket.emit(EXISTING_CHAT, chat);
    return true;
  } catch (e) {
    console.log('ERROR in createChat:', e.message);
    return false;
  }
};

const getChats = async (socket, username) => {
  try {
    const chats = await Chat.find({ 'members.username': username }, '-__v');
    socket.emit(GET_CHATS, chats);
    return true;
  } catch (e) {
    console.log('ERROR in getChats:', e.message);
    return false;
  }
};

const insertMessage = async (socket, msg) => {
  try {
    const { chatId, text, datetime, reciever, sender } = msg;
    // find chat by id
    const chat = await Chat.findById(chatId);
    if (!chat) return false;
    // add message to chat
    const msgId = uuid.v4();
    chat.messages.unshift({ id: msgId, text, datetime, reciever, sender });
    // save chat
    await chat.save();
    // emit message to all sockets in chat
    const newMsg = { id: msgId, text, datetime, reciever, sender };
    io.to(chatId).emit(NEW_MESSAGE, { chatId, msg: newMsg });
    io.emit(USER_TYPING, {
      chatId,
      username: sender.username,
      isTyping: false,
    });
    console.log('send to', await io.in(chatId).allSockets());
    return true;
  } catch (e) {
    console.log('ERROR in insertMessage:', e.message);
    return false;
  }
};

const changeIsTyping = async (socket, { chatId, isTyping, username }) => {
  io.emit(USER_TYPING, { chatId, username, isTyping });
};

module.exports = {
  changeIsTyping,
  connectToChat,
  initChat,
  getChats,
  insertMessage,
};
