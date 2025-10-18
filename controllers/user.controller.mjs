import User from '../models/user.model.mjs';

export const createUser = async (req, res) => {
  try {
    const { 
      profileCreatedFor, fullName, gender, dob, mobile, maritalStatus, email , ...data
    } = req.body;

    if (!profileCreatedFor || !fullName || !gender || !dob || !mobile || !maritalStatus) {
      return res.status(400).json({ message: 'Kripya sabhi zaroori fields bharein.' });
    }

    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ message: 'Is mobile number se user pehle se registered hai.' });
    }

    const user = await User.create({
      profileCreatedFor,
      fullName,
      gender,
      dob,
      mobile,
      maritalStatus,
      email,
      ...data
    });

    if (user) {
      res.status(201).json({
        message: 'User profile safaltapoorvak banaya gaya.',
        _id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
      });
    } else {
      res.status(400).json({ message: 'User data aमान्य hai.' });
    }
  } catch (error) {
    console.error('User banane mein error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};


export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User nahi mila.' });
    }
  } catch (error) {
    console.error('User profile prapt karne mein error:', error);
    res.status(500).json({ message: 'Server error.' });
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
        message: 'Profile safaltapoorvak update ho gayi.',
        user: updatedUser
      });
    } else {
      res.status(404).json({ message: 'User nahi mila.' });
    }
  } catch (error) {
    console.error('User profile update karne mein error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (user) {
            await user.deleteOne();
            res.status(200).json({ message: 'User safaltapoorvak delete kar diya gaya.' });
        } else {
            res.status(404).json({ message: 'User nahi mila.' });
        }
    } catch (error) {
        console.error('User delete karne mein error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

export const setPrimaryImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL zaroori hai.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User nahi mila.' });
    }

    if (!user.images.includes(imageUrl)) {
      return res.status(400).json({ message: 'Yeh image is user ki nahi hai.' });
    }

    user.primaryImage = imageUrl;
    await user.save();

    res.status(200).json({ 
      message: 'Primary image safaltapoorvak update ho gayi.',
      primaryImage: user.primaryImage 
    });
  } catch (error) {
    console.error('Primary image set karne mein error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const addImages = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Kripya upload karne ke liye files chunein.' });
        }
        
        const imageUrls = req.files.map(file => file.location);

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User nahi mila.' });
        }
        
        user.images.push(...imageUrls);
        
        if (!user.primaryImage) {
            user.primaryImage = imageUrls[0];
        }
        
        await user.save();

        res.status(200).json({
            message: 'Images safaltapoorvak jod di gayi.',
            images: user.images,
            primaryImage: user.primaryImage
        });
    } catch (error) {
        console.error('Images jodne mein error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

export const deleteImage = async (req, res) => {
    try {
        const { userId } = req.params;
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL zaroori hai.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User nahi mila.' });
        }

        if (!user.images.includes(imageUrl)) {
            return res.status(400).json({ message: 'Image profile mein nahi mili.' });
        }

        user.images = user.images.filter(img => img !== imageUrl);
        
        if (user.primaryImage === imageUrl) {
            user.primaryImage = user.images[0] || null; 
        }

        await user.save();

        res.status(200).json({
            message: 'Image safaltapoorvak delete ho gayi.',
            images: user.images,
            primaryImage: user.primaryImage
        });
    } catch (error) {
        console.error('Image delete karne mein error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

