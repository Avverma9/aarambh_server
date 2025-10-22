import Caste from "../models/caste.model.mjs";
import { asyncHandler } from "../util/asyncHandler.mjs";
export const addCastes = async (req, res) => {
  try {
    const { castes } = req.body;
    if (!Array.isArray(castes) || castes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array of caste objects",
      });
    }

    // Validate each entry
    const validEntries = castes.filter(
      (item) =>
        typeof item.caste === "string" &&
        Array.isArray(item.subCaste) &&
        Array.isArray(item.gotra)
    );
    if (validEntries.length !== castes.length) {
      return res.status(422).json({
        success: false,
        message:
          "Each object must have `caste` (string), `subCaste` (string[]), and `gotra` (string[])",
      });
    }

    // Perform bulk insert
    const inserted = await Caste.insertMany(validEntries, { ordered: false });
    res.status(201).json({
      success: true,
      insertedCount: inserted.length,
      data: inserted,
    });
  } catch (error) {
    // Handle duplicate key or other errors
    if (error.name === "BulkWriteError") {
      return res.status(409).json({
        success: false,
        message:
          "Some entries could not be inserted due to duplicates or validation errors",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getCastes = asyncHandler(async (req, res) => {
  const getData = await Caste.find();
  res.status(200).json(getData);
});



export const getSubCasteByCaste = asyncHandler(async (req, res) => {
  const { caste } = req.query;
  const getData = await Caste.findOne({ caste });
  const subCaste = getData.subCaste;
  res.status(200).json(subCaste);
});

export const getGotraByCaste = asyncHandler(async (req, res)=>{
  const {caste} = req.query
  const getData = await Caste.findOne({caste})
  const gotra = getData.gotra
  res.status(200).json(gotra)

})