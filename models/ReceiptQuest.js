const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

// ReceiptQuestSchema
let ReceiptQuestSchema = new Schema({
  questId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Quest',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
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
  point: {
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

module.exports = mongoose.model('ReceiptQuest', ReceiptQuestSchema);
