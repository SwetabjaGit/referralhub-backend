const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");


const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  region: process.env.S3_REGION
})

const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET,
  acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const fileName = Date.now() + "_" + file.fieldname + "_" + file.originalname;
    cb(null, fileName);
  }
});

// our middleware
const uploadImage = multer({
  storage: s3Storage,
  // limits: {
  //   fileSize: 1024 * 1024 * 2 // 2mb file size
  // }
})

module.exports = uploadImage;