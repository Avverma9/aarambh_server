import User from "../models/user.model.mjs";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;

    // Fetch user with populated matches
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update matches before sending response
    await updateUserMatches(userId);

    // Fetch updated user with new matches
    const updatedUser = await User.findById(userId)
      .select("-password -refreshToken")
      .populate(
        "matches.recent",
        "fullName primaryImage age location isPremium"
      )
      .populate("matches.new", "fullName primaryImage age location isPremium")
      .populate(
        "matches.premium",
        "fullName primaryImage age location isPremium"
      )
      .populate("matches.all", "fullName primaryImage age location isPremium");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error fetching user profile:", error);
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
      gender:
        user.gender === "Male"
          ? "Female"
          : user.gender === "Female"
          ? "Male"
          : { $ne: user.gender },
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
        $lte: prefs.heightRange.max,
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
    const premiumMatchIds = allMatches
      .filter((m) => m.isPremium)
      .map((m) => m._id);
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
    console.error("Error fetching all users:", error);
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
        message: "Profile updated successfully.",
        user: updatedUser,
      });
    } else {
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (user) {
      await user.deleteOne();
      res.status(200).json({ message: "User deleted successfully." });
    } else {
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const setPrimaryImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.images.includes(imageUrl)) {
      return res
        .status(400)
        .json({ message: "This image does not belong to this user." });
    }

    user.primaryImage = imageUrl;
    await user.save();

    res.status(200).json({
      message: "Primary image updated successfully.",
      primaryImage: user.primaryImage,
    });
  } catch (error) {
    console.error("Error setting primary image:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const addImages = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select files to upload." });
    }

    const images = req.files.map((file) => file.location);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.images.push(...images);

    if (!user.primaryImage) {
      user.primaryImage = images[0];
    }

    await user.save();

    res.status(200).json({
      message: "Images added successfully.",
      images: user.images,
      primaryImage: user.primaryImage,
    });
  } catch (error) {
    console.error("Error adding images:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.images.includes(imageUrl)) {
      return res.status(400).json({ message: "Image not found in profile." });
    }

    user.images = user.images.filter((img) => img !== imageUrl);

    if (user.primaryImage === imageUrl) {
      user.primaryImage = user.images[0] || null;
    }

    await user.save();

    res.status(200).json({
      message: "Image deleted successfully.",
      images: user.images,
      primaryImage: user.primaryImage,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const likeProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { likedUserId } = req.body;

    if (!likedUserId)
      return res.status(400).json({ message: "Liked user ID is required." });

    const [user, likedUser] = await Promise.all([
      User.findById(userId),
      User.findById(likedUserId),
    ]);

    if (!user || !likedUser)
      return res.status(404).json({ message: "User not found." });

    user.matches = user.matches || {
      recent: [],
      new: [],
      premium: [],
      all: [],
    };
    likedUser.matches = likedUser.matches || {
      recent: [],
      new: [],
      premium: [],
      all: [],
    };

    if (
      user.matches.recent.includes(likedUserId) ||
      user.matches.new.includes(likedUserId)
    )
      return res
        .status(200)
        .json({ message: "You have already liked this profile." });

    const isMutual =
      likedUser.matches.recent.includes(userId) ||
      likedUser.matches.new.includes(userId);

    if (isMutual) {
      user.matches.new.push(likedUserId);
      likedUser.matches.new.push(userId);
      user.matches.recent = user.matches.recent.filter(
        (id) => id.toString() !== likedUserId.toString()
      );
      likedUser.matches.recent = likedUser.matches.recent.filter(
        (id) => id.toString() !== userId.toString()
      );
      await Promise.all([user.save(), likedUser.save()]);
      return res
        .status(200)
        .json({
          message: "🎉 Mutual Match! Added to both users' new matches.",
        });
    } else {
      user.matches.recent.push(likedUserId);
      await user.save();
      return res
        .status(200)
        .json({ message: "Profile added to recent likes." });
    }
  } catch (error) {
    console.error("Profile like error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const getMatchedProfiles = async (req, res) => {
  try {
    const { userId } = req.params;
    const findUser = await User.findById(userId).populate(
      "matches.recent matches.new matches.premium matches.all",
      "fullName primaryImage age location isPremium"
    );
    if (!findUser) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json({ matches: findUser.matches });
  } catch (error) {
    console.error("Error fetching matched profiles:", error);
    res.status(500).json({ message: "Server error." });
  }
};
