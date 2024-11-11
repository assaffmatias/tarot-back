const { Schema, model } = require("mongoose");

const cardSchema = new Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true
  },
  text: { 
    type: String, 
    required: true 
  },
}, {
  timestamps: true
});

module.exports = model("Card", cardSchema);