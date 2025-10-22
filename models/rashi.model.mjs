import mongoose from "mongoose";
const rashiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});
const Rashi = mongoose.model("Rashi", rashiSchema);
export default Rashi;
