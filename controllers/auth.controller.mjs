import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs";

export const loginUser = async (req, res) => {
  const { mobile, email } = req.body;
   const detail = email || mobile;
  if (detail) {
    const user = User.findOne({ detail });
    if(!user){
        return res.status(404).json({ message: "User not found" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ data: user, token });
  }
};
