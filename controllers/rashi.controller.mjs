import Rashi from "../models/rashi.model.mjs";
import { asyncHandler } from "../util/asyncHandler.mjs";

export const addRashi = asyncHandler(async (req, res) => {
  const { rashis } = req.body;
  if (!Array.isArray(rashis) || rashis.length === 0) {
    return res
      .status(400)
      .json({ error: "Rashis are required in array format" });
  }
  const rashi = await Rashi.insertMany(rashis, { ordered: true });
  res.status(201).json(rashi);
});
export const getRashi = asyncHandler(async (req, res) => {
  const getData = await Rashi.find();
  res.status(200).json(getData);
});