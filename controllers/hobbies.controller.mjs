import Hobbies from "../models/hobbies.model.mjs";
import { asyncHandler } from "../util/asyncHandler.mjs";

export const addHobbies = asyncHandler(async (req, res) => {
  const { hobbies } = req.body;
  if (!Array.isArray(hobbies) || hobbies.length === 0) {
    return res
      .status(400)
      .json({ error: "Hobbies are required in array format" });
  }
  const hobby = await Hobbies.insertMany(hobbies, { ordered: true });
  res.status(201).json(hobby);
});

export const getHobbies = asyncHandler(async (req, res) => {
  const getData = await Hobbies.find();
  res.status(200).json(getData);
});

export const deleteHobbies = asyncHandler(async (req, res) => { 
    const deleteHobbies = await Hobbies.deleteMany();
    res.status(200).json(deleteHobbies);

})