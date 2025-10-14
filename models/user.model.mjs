import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Section 1: Basic & Contact Information
  profileCreatedFor: {
    type: String,
    enum: ['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Friend', 'Relative'],
    required: true,
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required.'],
    trim: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required.'],
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required.'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true, 
  },

  // Section 2: Physical Attributes & Lifestyle
  height: { // Stored in centimeters
    type: Number,
  },
  bodyType: {
    type: String,
    enum: ['Slim', 'Athletic', 'Average', 'Heavy'],
  },
  complexion: {
    type: String,
    enum: ['Very Fair', 'Fair', 'Wheatish', 'Dark'],
  },
  maritalStatus: {
    type: String,
    enum: ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'],
    required: true,
  },
  diet: {
    type: String,
    enum: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Jain', 'Vegan'],
  },
  disability: {
    type: String,
    default: 'None',
  },

  // Section 3: Religious & Community Details
  religion: {
    type: String,
    trim: true,
  },
  motherTongue: {
    type: String,
    trim: true,
  },
  caste: {
    type: String,
    trim: true,
  },
  subCaste: {
    type: String,
    trim: true,
  },
  gotra: {
    type: String,
    trim: true,
  },
  manglikStatus: {
    type: String,
    enum: ['Yes', 'No', 'Partial', "Don't Know"],
    default: "Don't Know",
  },
  
  // Section 4: Astrological Details
  rashi: { // Moon Sign
    type: String,
    trim: true,
  },
  nakshatra: { // Birth Star
    type: String,
    trim: true,
  },
  timeOfBirth: {
    type: String, // e.g., "08:30 AM"
  },
  placeOfBirth: {
    type: String, // e.g., "Delhi, India"
  },

  // Section 5: Location
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India',
    },
  },

  // Section 6: Education & Career
  highestEducation: {
    type: String,
    trim: true,
  },
  profession: {
    type: String,
    trim: true,
  },
  annualIncome: { // in Lakhs Per Annum (LPA)
    type: String, 
  },

  // Section 7: Family Details
  familyDetails: {
    fatherStatus: String, // e.g., 'Employed', 'Business', 'Retired'
    motherStatus: String, // e.g., 'Homemaker', 'Employed'
    familyType: { type: String, enum: ['Joint', 'Nuclear'] },
    familyValues: { type: String, enum: ['Traditional', 'Moderate', 'Liberal'] },
    siblings: {
      brothers: Number,
      sisters: Number,
      marriedBrothers: Number,
      marriedSisters: Number,
    }
  },

  // Section 8: Profile Details
  aboutMe: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  primaryImage: {
    type: String,
    trim: true,
  },
  images: [String],
  
  // Section 9: Account Management & Authentication
  accountStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'VerificationPending', 'Suspended','Verified'],
    default: 'VerificationPending',
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  refreshToken: {
    type: String,
  },

  // Section 10: Partner Preferences
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

}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
