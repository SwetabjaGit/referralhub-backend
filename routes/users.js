const router = require("express").Router();
const { User, validate } = require("../models/user");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


router.post("/signup", async (req, res) => {
  try {
    const { error } = validate(req.body);

    if (error)
      return res.status(400).send({ message: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (user)
      return res
        .status(409)
        .send({ message: "User with given email already Exist!" });

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    user = await new User({ 
      ...req.body, 
      password: hashPassword 
    }).save();

    const token = await new Token({
      userId: user._id,
      //token: crypto.randomBytes(32).toString("hex"),
      token: jwt.sign({ data: 'Token Data'}, 'Temp_Token', { expiresIn: '1h' }),
    }).save();

    const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
    await sendEmail(user.email, "Activate your account", url);

    res
      .status(201)
      .send({
        userId: user._id,
        message: "An Email sent to your account please verify" 
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



// Creating middleware to fetch user
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  if(!token) {
    res.status(401).send({error: "Please authenticate using valid token"});
  }
  else {
    try {
      const data = jwt.verify(token, process.env.JWTPRIVATEKEY);
      console.log('tokenData: ', data);
      req.userId = data._id;
      next();
      //res.status(200).send({ success: "true", user: data.user });
    } catch(error) {
      res.status(401).send({ error: "Please authenticate using a valid token" });
    }
  }
}


router.get("/getuserdetails", fetchUser, async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.userId });
    console.log(userData);
    if (!userData) {
      return res.status(400).send({ message: "User not found" });
    }
    res.status(200).send({ 
      message: "User Retrieved Successfully", 
      user: userData 
    });
  } catch(error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});



router.post("/:userid/rewarduser/:refcode", async (req, res) => {
  try {
    const user = await User.findOne({ referralCode: req.params.refcode });
    if (!user) {
      return res.status(400).send({ message: "Invalid Referral Code" });
    }

    //fetch the details of the registered user
    const registeredUser = await User.findOne({ _id: req.params.userid });
    if (!registeredUser) {
      return res.status(400).send({ message: "Registered user not found" });
    }

    let noOfReferrals = user.numReferrals + 1;
    let reward = user.rewardsEarned + 120;
    await User.updateOne({ _id: user._id }, {
      numReferrals: noOfReferrals,
      rewardsEarned: reward
    });

    const referral = {
      email: registeredUser.email,
      referralDate: new Date(Date.now())
    }
    user.referrals.push(referral);
    await user.save();

    console.log("Rewards updated");
    res.status(200).send({ message: "User Rewarded" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});


router.post("/:id/updateimageurl", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    await User.updateOne({ _id: user._id }, { imageUrl: req.body.imageUrl });
    
    console.log(`ImageUrl Updated for user ${user.email}`);
    res.status(200).send({ message: "ImageUrl updated successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});


router.post("/:id/verifyimage", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    await User.updateOne({ _id: user._id }, { imageVerified: true });

    console.log(`Image Verified for user ${user.email}`);
    res.status(200).send({ message: "Image verified successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});


router.post("/:id/generatereferral", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    let referralCodeStr = crypto.randomBytes(5).toString("hex");
    
    if(!user.referralCode) {
      await User.updateOne({ _id: user._id }, { referralCode: referralCodeStr });
      console.log(`Referral Code generated for user ${user.email}`);
      res.status(200).send({ message: `Generated referral code: ${referralCodeStr}` });
    }
    else {
      console.log(`Referralcode already exists`);
      res.status(200).send({ message: "Referralcode already exists" });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
})


router.get("/:id/verify/:token/", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(400).send({ message: "Invalid link" });
    }

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    //console.log('token', token);
    if (!token) return res.status(400).send({ message: "Invalid link" });

    await User.updateOne({ _id: user._id }, { activated: true });
    await token.remove();

    console.log('Email verified successfully');
    res.status(200).send({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
