import mongoose from "mongoose";

const casteSchema = new mongoose.Schema(
  {
    caste: String,
    subCaste: [String],
    gotra: [String],
  },
  { timestamps: true }
);
const Caste = mongoose.model("Caste", casteSchema);

export default Caste;
