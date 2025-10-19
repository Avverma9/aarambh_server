import User from "../models/user.model.mjs";

export const createUser = async (req, res) => {
  try {
    const {
      profileCreatedFor,
      fullName,
      gender,
      dob,
      mobile,
      maritalStatus,
      email,
      ...data
    } = req.body;

    if (
      !profileCreatedFor ||
      !fullName ||
      !gender ||
      !dob ||
      !mobile ||
      !maritalStatus
    ) {
      return res
        .status(400)
        .json({ message: "Kripya sabhi zaroori fields bharein." });
    }

    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "Is mobile number se user pehle se registered hai." });
    }

    const user = await User.create({
      profileCreatedFor,
      fullName,
      gender,
      dob,
      mobile,
      maritalStatus,
      email,
      ...data,
    });

    if (user) {
      res.status(201).json({
        message: "User profile safaltapoorvak banaya gaya.",
        _id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
      });
    } else {
      res.status(400).json({ message: "User data aमान्य hai." });
    }
  } catch (error) {
    console.error("User banane mein error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    // Fetch user with populated matches
    const user = await User.findById(userId).select("-password -refreshToken");
    
    if (!user) {
      return res.status(404).json({ message: "User nahi mila." });
    }

    // Update matches before sending response
    await updateUserMatches(userId);
    
    // Fetch updated user with new matches
    const updatedUser = await User.findById(userId)
      .select("-password -refreshToken")
      .populate("matches.recent", "fullName primaryImage age location isPremium")
      .populate("matches.new", "fullName primaryImage age location isPremium")
      .populate("matches.premium", "fullName primaryImage age location isPremium")
      .populate("matches.all", "fullName primaryImage age location isPremium");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("User profile prapt karne mein error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Match finding logic
async function updateUserMatches(userId) {
  try {
    const user = await User.findById(userId)
      .select("partnerPreferences isPremium lastSeen location gender")
      .lean();

    if (!user || !user.partnerPreferences) return;

    const prefs = user.partnerPreferences;
    
    // Build match filter based on partner preferences
    const matchFilter = {
      _id: { $ne: userId },
      accountStatus: "Active",
      gender: user.gender === "Male" ? "Female" : user.gender === "Female" ? "Male" : { $ne: user.gender },
    };

    // Age range filter
    if (prefs.ageRange?.min && prefs.ageRange?.max) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - prefs.ageRange.min);
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - prefs.ageRange.max);
      matchFilter.dob = { $gte: minDate, $lte: maxDate };
    }

    // Height range filter
    if (prefs.heightRange?.min && prefs.heightRange?.max) {
      matchFilter.height = { 
        $gte: prefs.heightRange.min, 
        $lte: prefs.heightRange.max 
      };
    }

    // Religion filter
    if (prefs.religions?.length > 0) {
      matchFilter.religion = { $in: prefs.religions };
    }

    // Mother tongue filter
    if (prefs.motherTongues?.length > 0) {
      matchFilter.motherTongue = { $in: prefs.motherTongues };
    }

    // Caste filter
    if (prefs.castes?.length > 0) {
      matchFilter.caste = { $in: prefs.castes };
    }

    // Marital status filter
    if (prefs.maritalStatuses?.length > 0) {
      matchFilter.maritalStatus = { $in: prefs.maritalStatuses };
    }

    // Diet filter
    if (prefs.diets?.length > 0) {
      matchFilter.diet = { $in: prefs.diets };
    }

    // Profession filter
    if (prefs.professions?.length > 0) {
      matchFilter.profession = { $in: prefs.professions };
    }

    // Location proximity filter (if coordinates exist)
    if (user.location?.coordinates?.coordinates?.length === 2) {
      matchFilter["location.coordinates"] = {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: user.location.coordinates.coordinates,
          },
          $maxDistance: 100000, // 100 km radius (adjust as needed)
        },
      };
    }

    // Fetch all matching users
    const allMatches = await User.find(matchFilter)
      .select("_id isPremium createdAt")
      .limit(500)
      .lean();

    // Categorize matches
    const allMatchIds = allMatches.map((m) => m._id);
    const premiumMatchIds = allMatches.filter((m) => m.isPremium).map((m) => m._id);
    const newMatchIds = allMatches
      .filter((m) => new Date(m.createdAt) > new Date(user.lastSeen))
      .map((m) => m._id);
    const recentMatchIds = allMatchIds.slice(0, 20); // Top 20 as recent

    // Update user matches
    await User.findByIdAndUpdate(userId, {
      $set: {
        "matches.all": allMatchIds,
        "matches.premium": premiumMatchIds,
        "matches.new": newMatchIds,
        "matches.recent": recentMatchIds,
      },
    });

  } catch (error) {
    console.error("Matches update error:", error);
  }
}


export const getAllUsers = async function (req, res) {
  try {
    const response = await User.find();
    return res.status(200).json(response);
  } catch (error) {
    console.error("All users prapt karne mein error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (user) {
      Object.assign(user, req.body);

      if (req.file && req.file.location) {
        const newImageUrl = req.file.location;
        if (!user.images.includes(newImageUrl)) {
          user.images.push(newImageUrl);
        }
        user.primaryImage = newImageUrl;
      }

      const updatedUser = await user.save();
      res.status(200).json({
        message: "Profile safaltapoorvak update ho gayi.",
        user: updatedUser,
      });
    } else {
      res.status(404).json({ message: "User nahi mila." });
    }
  } catch (error) {
    console.error("User profile update karne mein error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (user) {
      await user.deleteOne();
      res
        .status(200)
        .json({ message: "User safaltapoorvak delete kar diya gaya." });
    } else {
      res.status(404).json({ message: "User nahi mila." });
    }
  } catch (error) {
    console.error("User delete karne mein error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const setPrimaryImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL zaroori hai." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User nahi mila." });
    }

    if (!user.images.includes(imageUrl)) {
      return res
        .status(400)
        .json({ message: "Yeh image is user ki nahi hai." });
    }

    user.primaryImage = imageUrl;
    await user.save();

    res.status(200).json({
      message: "Primary image safaltapoorvak update ho gayi.",
      primaryImage: user.primaryImage,
    });
  } catch (error) {
    console.error("Primary image set karne mein error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const addImages = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "Kripya upload karne ke liye files chunein." });
    }

    const imageUrls = req.files.map((file) => file.location);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User nahi mila." });
    }

    user.images.push(...imageUrls);

    if (!user.primaryImage) {
      user.primaryImage = imageUrls[0];
    }

    await user.save();

    res.status(200).json({
      message: "Images safaltapoorvak jod di gayi.",
      images: user.images,
      primaryImage: user.primaryImage,
    });
  } catch (error) {
    console.error("Images jodne mein error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL zaroori hai." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User nahi mila." });
    }

    if (!user.images.includes(imageUrl)) {
      return res.status(400).json({ message: "Image profile mein nahi mili." });
    }

    user.images = user.images.filter((img) => img !== imageUrl);

    if (user.primaryImage === imageUrl) {
      user.primaryImage = user.images[0] || null;
    }

    await user.save();

    res.status(200).json({
      message: "Image safaltapoorvak delete ho gayi.",
      images: user.images,
      primaryImage: user.primaryImage,
    });
  } catch (error) {
    console.error("Image delete karne mein error:", error);
    res.status(500).json({ message: "Server error." });
  }
};
