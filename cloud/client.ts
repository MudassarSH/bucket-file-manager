import { S3Client } from "@aws-sdk/client-s3";

export function createR2Client() {
    const { R2_API_ENDPOINT, R2_ACCESS_KEY, R2_ACCESS_SECRET } = process.env;
    if (!R2_API_ENDPOINT || !R2_ACCESS_KEY || !R2_ACCESS_SECRET) {
        throw new Error('Missing one of R2_ENDPOINT, R2_ACCESS_KEY, R2_ACCESS_SECRET');
    }

    return new S3Client({
        region: 'auto',
        endpoint: R2_API_ENDPOINT,
        credentials: {
            accessKeyId: R2_ACCESS_KEY,
            secretAccessKey: R2_ACCESS_SECRET
        }
    })
}