const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
  rank: {
    type: String,
    required: true,
  },
  online: {
    type: Boolean,
    required: true,
    default: false,
  },
  role: {
    type: String,
    required: true,
    default: 'USER',
  },
});

module.exports = mongoose.model('User', UserSchema);
