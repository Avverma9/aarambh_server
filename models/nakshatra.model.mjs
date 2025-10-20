import mongoose from "mongoose";
const nakshatraSchema = new mongoose.Schema({
  name: String,
});
const Nakshatra = mongoose.model("Nakshatra", nakshatraSchema);
export default Nakshatra;
