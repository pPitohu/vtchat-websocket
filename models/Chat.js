const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  members: {
    type: Array,
    required: true,
    validate: [(v) => v.length <= 2, '{PATH} exceeds the limit of 2'],
  },
  messages: {
    type: Array,
    required: true,
    default: [],
  },
});

module.exports = mongoose.model('Chat', ChatSchema);
