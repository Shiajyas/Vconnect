import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../../infrastructure/utils/s3Client";

// const bucketName = process.env.AWS_S3_BUCKET_NAME!;
// const cloudFrontUrl = process.env.AWS_CLOUDFRONT_URL!; 

const bucketName = "vconnect-bucket"
console.log("🔹 AWS S3 Bucket Name:", bucketName);

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    acl: "private",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      console.log("🔹 Uploading file:", file.originalname);
      
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `uploads/${Date.now()}_${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // Limit file size to 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/ogg",  "application/pdf" ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

export { upload };
