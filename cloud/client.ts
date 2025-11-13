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

export function createS3Client() {
    const { AWS_ACCESS_KEY, AWS_ACCESS_SECRET, AWS_REGION } = process.env;
    if (!AWS_ACCESS_KEY || !AWS_ACCESS_SECRET || !AWS_REGION) {
        throw new Error('Missing one of R2_ENDPOINT, R2_ACCESS_KEY, R2_ACCESS_SECRET');
    }

    return new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY,
            secretAccessKey: AWS_ACCESS_SECRET
        }
    })
}