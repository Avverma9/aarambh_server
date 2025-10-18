import User from "../models/user.model.mjs";

export const register = async (req, res) => {
  try {
    const {
      profileCreatedFor,
      fullName,
      gender,
      dob,
      mobile,
      maritalStatus,
      email,
    } = req.body;

    // Extract image locations from files array, if any
    const images = req.files ? req.files.map((file) => file.location || file.path) : [];

    // Create user document
    const user = await User.create({
      profileCreatedFor,
      fullName,
      gender,
      dob,
      mobile,
      maritalStatus,
      email,
      images,
    });

    return res.status(201).json({ message: "User registered successfully", userId: user._id });
  } catch (error) {
    console.error("Error during user registration:", error);
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};
