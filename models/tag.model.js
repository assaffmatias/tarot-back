const { Schema, model } = require("mongoose");

const tagSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    state: { type: Boolean, default: true },
  },
  { versionKey: false }
);

module.exports = model("Tag", tagSchema);
