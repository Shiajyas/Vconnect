// Import dotenv and AWS S3 Client
import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";

// Load environment variables from .env file
dotenv.config();

// Validate required AWS env vars
const { AWS_REGION, AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY } = process.env;

if (!AWS_REGION || !AWS_ACCESS_KEY || !AWS_SECRET_ACCESS_KEY) {
  throw new Error("Missing AWS S3 environment variables");
}

// Create the S3 client
const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {  
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export default s3;
