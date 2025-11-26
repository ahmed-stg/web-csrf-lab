const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  passwordhash: {
    type: String,
    required: true,
    minlength: 6
  },
  jwt_token: {
    type: String,
    default: null
  },
  birthdate: {
    type: Date,
    required: true
  },
  profile_picture: {
    type: String,
    default: null // base64 string
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordhash')) return next();
  this.passwordhash = await bcrypt.hash(this.passwordhash, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordhash);
};

module.exports = mongoose.model('User', userSchema);