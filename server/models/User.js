const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  age: {
    type: Number,
    required: [true, 'Please provide your age'],
    min: 18,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  district: {
    type: String,
    enum: [
      'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 
      'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 
      'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
    ],
    required: [true, 'Please select your district in Kerala'],
  },
  profession: String,
  bio: {
    type: String,
    maxlength: 500,
  },
  images: [String], // URLs to images (Cloudinary)
  interests: [String],
  motherTongue: {
    type: String,
    default: 'Malayalam',
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  swipedRight: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  swipedLeft: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
