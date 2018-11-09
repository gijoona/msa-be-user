const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

let QuestSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  contents: {
    type: String,
    required: true
  },
  powerExp: {
    type: Number,
    default: 0
  },
  staminaExp: {
    type: Number,
    default: 0
  },
  knowledgeExp: {
    type: Number,
    default: 0
  },
  relationExp: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String]
  },
  state: {
    type: String,
    default: 'process'
  },
  inputDt: {
    type: Date,
    defualt: Date.now
  }
});

module.exports = mongoose.model('Quest', QuestSchema);
