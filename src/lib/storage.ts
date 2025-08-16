import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

export async function getAudioSignedUrl(key: string, expiresIn = 3600) {
  if (!process.env.AWS_S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

