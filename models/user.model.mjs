import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic Profile
    profileCreatedFor: {
      type: String,
      enum: [
        "Self",
        "Son",
        "Daughter",
        "Brother",
        "Sister",
        "Friend",
        "Relative",
      ],
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
    },
    age:Number,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    hobbies:[String],
    dob: {
      type: Date,
      required: [true, "Date of birth is required."],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required."],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // Physical Attributes
    height: Number,
    bodyType: {
      type: String,
      enum: ["Slim", "Athletic", "Average", "Heavy"],
    },
    complexion: {
      type: String,
      enum: ["Very Fair", "Fair", "Wheatish", "Dark"],
    },
    diet: {
      type: String,
      enum: ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Jain", "Vegan"],
    },
    disability: {
      type: String,
      default: "None",
    },

    // Marital Status & Astrology
    maritalStatus: {
      type: String,
      enum: ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"],
      required: true,
    },
    religion: { type: String, trim: true },
    motherTongue: { type: String, trim: true },
    caste: { type: String, trim: true },
    subCaste: { type: String, trim: true },
    gotra: { type: String, trim: true },
    manglikStatus: {
      type: String,
      enum: ["Yes", "No", "Partial", "Don't Know"],
      default: "Don't Know",
    },
    rashi: { type: String, trim: true },
    nakshatra: { type: String, trim: true },
    timeOfBirth: String,
    placeOfBirth: String,

    // Geolocation & Residence
    location: {
      city: String,
      state: String,
      country: { type: String, default: "India" },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], index: "2dsphere", default: [] }, // [lng, lat]
      },
    },

    // Education & Profession
    highestEducation: { type: String, trim: true },
    profession: { type: String, trim: true },
    annualIncome: String,

    // Family Details
    familyDetails: {
      fatherStatus: String,
      motherStatus: String,
      familyType: { type: String, enum: ["Joint", "Nuclear"] },
      familyValues: {
        type: String,
        enum: ["Traditional", "Moderate", "Liberal"],
      },
      siblings: {
        brothers: Number,
        sisters: Number,
        marriedBrothers: Number,
        marriedSisters: Number,
      },
    },

    // Biography & Images
    aboutMe: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    primaryImage: { type: String, trim: true },
    images: [String],

    // Account & Auth
    accountStatus: {
      type: String,
      enum: [
        "Active",
        "Inactive",
        "VerificationPending",
        "Suspended",
        "Verified",
      ],
      default: "VerificationPending",
    },
    googleId: { type: String, unique: true, sparse: true },
    refreshToken: String,

    // Presence & Calls
    lastSeen: { type: Date, default: Date.now },
    onlineStatus: { type: Boolean, default: false },
    callHistory: [
      {
        withUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: { type: String, enum: ["audio", "video"] },
        startedAt: Date,
        endedAt: Date,
        callStatus: {
          type: String,
          enum: ["missed", "completed", "declined"],
        },
      },
    ],

    // Matches & Preferences
    isPremium: { type: Boolean, default: false },
    matches: {
      recent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      new: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      premium: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      all: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    partnerPreferences: {
      ageRange: { min: Number, max: Number },
      heightRange: { min: Number, max: Number },
      religions: [String],
      motherTongues: [String],
      castes: [String],
      subCastes: [String],
      manglikStatus: [String],
      maritalStatuses: [String],
      diets: [String],
      professions: [String],
    },

    // Notifications
    notifications: [
      {
        type: {
          type: String,
          enum: [
            "new-match",
            "premium-match",
            "call-invite",
            "message",
            "system",
          ],
        },
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound & Geospatial Indexes
userSchema.index({ "location.coordinates": "2dsphere" });
userSchema.index({ gender: 1, religion: 1, "location.coordinates": "2dsphere" });
userSchema.index({ isPremium: 1, annualIncome: 1 });

const User = mongoose.model("User", userSchema);

export default User;
