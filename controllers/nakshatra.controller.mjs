import Nakshatra from "../models/nakshatra.model.mjs";
import { asyncHandler } from "../util/asyncHandler.mjs";

export const addNakshatras = asyncHandler(async (req, res) => {
  const { nakshatras } = req.body;

  if (!Array.isArray(nakshatras) || nakshatras.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Request body must be a non-empty array of nakshatra objects",
    });
  }

  // Validate each entry
  const validEntries = nakshatras.filter(
    (item) => typeof item.name === "string"
  );
  if (validEntries.length !== nakshatras.length) {
    return res.status(422).json({
      success: false,
      message: "Each object must have `name` (string)",
    });
  }
  // Perform bulk insert
  const inserted = await Nakshatra.insertMany(validEntries, { ordered: false });
  res.status(201).json({
    success: true,
    insertedCount: inserted.length,
    data: inserted,
  });
});

export const getNakshatras = asyncHandler(async (req, res) => {
  const getData = await Nakshatra.find();
  const nakshatras = getData.map((nakshatra) => nakshatra.name);
  res.status(200).json(nakshatras);
});
