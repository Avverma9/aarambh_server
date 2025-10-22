import mongoose from "mongoose";

const hobbiesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const Hobbies = mongoose.model("Hobbies", hobbiesSchema);

export default Hobbies;
