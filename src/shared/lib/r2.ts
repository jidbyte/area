import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and fill in R2 credentials.`,
    );
  }
  return value;
}

export function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${requiredEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

/** Presigned PUT URL — lets the browser upload directly to R2, bypassing our server. */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: requiredEnv("R2_BUCKET_NAME"),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 300 }); // 5 minutes
}

export function publicUrlForKey(key: string): string {
  return `${requiredEnv("R2_PUBLIC_URL")}/${key}`;
}
