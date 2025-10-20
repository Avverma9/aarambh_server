import mongoose from "mongoose";
const rashiSchema = new mongoose.Schema({
  name: String,
});
const Rashi = mongoose.model("Rashi", rashiSchema);
export default Rashi;
