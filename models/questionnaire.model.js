const { model, Schema } = require("mongoose");

const questionnaireSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Por favor ingrese el titulo del cuestionario"],
    },
    level: {
      type: String,
      required: [true, "Por favor ingrese el nivel del cuestionario"],
    },
    questions: {
      type: [{ type: Schema.Types.ObjectId, ref: "Question" }],
      default: true,
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = model("Questionnaire", questionnaireSchema);
