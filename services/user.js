const { USER_UPDATE_ONLINE, ALL_USERS, SET_USER } = require('../constants');
const { io } = require('../io');
const User = require('../models/User');

const checkForUserExistance = async ({ username, id }) =>
  await User.findOne({ username, id }, '-_id -__v');

const registerUser = async (socket, { username, id, rank }) => {
  try {
    const user = await checkForUserExistance({ username, id });

    // already exists
    if (user) {
      socket.emit(SET_USER, user);
      return;
    }
    // not exists, create
    const newUser = await new User({ username, id, rank }, '-_id -__v').save();
    socket.emit(SET_USER, newUser);
    console.log('User registered', { username, id, rank });
    return true;
  } catch (e) {
    console.log('ERROR in registerUser:', e.message);
    return false;
  }
};

const setOnlineStatus = async ({ username, id }, status) => {
  try {
    await User.findOneAndUpdate({ id }, { online: status });
    // send update to all users
    io.emit(USER_UPDATE_ONLINE, { username, online: status });
    return true;
  } catch (e) {
    console.log('ERROR in setOnlineStatus:', e.message);
    return false;
  }
};

const sendAllUsers = async (socket) => {
  try {
    const users = await User.find({}, '-_id -__v');
    // send users to socket with no messages
    socket.emit(ALL_USERS, users);
    return true;
  } catch (e) {
    console.log('ERROR in sendAllUsers:', e.message);
    return false;
  }
};

module.exports = {
  registerUser,
  setOnlineStatus,
  sendAllUsers,
};
