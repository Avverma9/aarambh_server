import User from "../models/user.model.mjs";

export const register = async (req, res) => {
  try {
    const userData = { ...req.body };

    // Calculate age from dob if provided
    if (userData?.dob) {
      const birthDate = new Date(userData.dob);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      userData.age = age;
    }

    // Check existing user
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Handle images
    userData.images = req.files
      ? req.files.map((file) => file.location || file.path)
      : [];

    if (userData.images.length > 0) {
      userData.primaryImage = userData.images[0];
    }

    // ✅ SET profileCompleted to true
    userData.profileCompleted = true;

    // Create user with modified userData
    const user = await User.create(userData);

    return res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      age: userData.age || null,
    });
  } catch (error) {
    console.error("❌ Error during user registration:", error);
    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};
