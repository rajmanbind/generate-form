const mongoose = require("mongoose");

const FormSchema = new mongoose.Schema({
  // uniqueId: { type: String, required: true, unique: true },
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  formData: { type: Object, required: true },
});

const Form = mongoose.model("Form", FormSchema);

module.exports = Form;
