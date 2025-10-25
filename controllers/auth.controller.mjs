import User from "../models/user.model.mjs";

export const register = async (req, res) => {
  try {
    const { dob, email, profession, aboutMe, ...restData } = req.body;

    const userData = { ...restData, email, profession };

    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      userData.dob = dob;
      userData.age = age;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    userData.images = req.files ? req.files.map((file) => file.location || file.path) : [];

    if (userData.images.length > 0) {
      userData.primaryImage = userData.images[0];
    }

    userData.aboutMe = aboutMe || `I am a ${profession || "professional"} looking for a meaningful connection.`;
    userData.profileCompleted = true;

    const user = await User.create(userData);

    return res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      age: userData.age || null,
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};
