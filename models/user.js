const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const userSchema = new mongoose.Schema({
  /* firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  }, */
  email: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  activated: { 
    type: Boolean, 
    default: false 
  },
  imageUrl: {
    type: String,
    required: false
  },
  imageVerified: {
    type: Boolean,
    default: false
  },
  referralCode: {
    type: String,
    required: false
  },
  numReferrals: {
    type: Number,
    default: 0
  },
  rewardsEarned: {
    type: Number,
    default: 0
  },
  referrals: {
    type: Object,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id }, 
    process.env.JWTPRIVATEKEY, 
    {
      expiresIn: "7d",
    }
  );
  return token;
};

const User = mongoose.model("user", userSchema);

const validate = (data) => {
  //let firstNameStr = Joi.string().required().label("First Name");
  //let lastNameStr = Joi.string().required().label("Last Name");
  let emailStr = Joi.string().email().required().label("Email");
  let passwordStr = passwordComplexity().required().label("Password");

  const schema = Joi.object({
    //firstName: firstNameStr,
    //lastName: lastNameStr,
    email: emailStr,
    password: passwordStr,
  });
  return schema.validate(data);
};

module.exports = { User, validate };
