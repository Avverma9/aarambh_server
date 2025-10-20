import Caste from "../models/caste.model.mjs";
export const addCastes = async (req, res) => {
  try {
    const casteArray = req.body;
    if (!Array.isArray(casteArray) || casteArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array of caste objects",
      });
    }

    // Validate each entry
    const validEntries = casteArray.filter(
      (item) =>
        typeof item.caste === "string" &&
        Array.isArray(item.subCaste) &&
        Array.isArray(item.gotra)
    );
    if (validEntries.length !== casteArray.length) {
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
