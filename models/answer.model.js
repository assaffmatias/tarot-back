const { model, Schema } = require("mongoose");

const answerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    questionnaire: { type: Schema.Types.ObjectId, ref: "Questionnaire" },
    correctQuestions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    incorrectQuestions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    date: { type: Date, default: Date.now },
    points: { type: Number, default: 0 },
  },
  { versionKey: false }
);

module.exports = model("Answer", answerSchema);
