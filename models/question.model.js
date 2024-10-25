const { model, Schema } = require("mongoose");

const questionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["multiple_choice", "open"],
      required: [true, "Es necesario specifier el tipo de pregunta."],
    },
    question: { type: String, required: true },
    choices: { type: [{ type: String }] },
    guide: { type: String },
    correct_answer: { type: String },
    points: { type: Number, required: true, default: 1 },
  },
  { versionKey: false }
);

module.exports = model("Question", questionSchema);
