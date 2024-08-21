require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const uploadImage = require('./utils/uploadImage');


// database connection
connection();

// middlewares
app.use(express.json());
app.use(cors());



app.post("/api/upload",  uploadImage.single("image"), (req, res, next) => {
  console.log(req.file);
  res.status(200).json({
    message: "Success",
    success: 1,
    location: req.file.location
  });
});


// routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

const port = process.env.PORT || 80;
app.listen(port, console.log(`Listening on port ${port}...`));
