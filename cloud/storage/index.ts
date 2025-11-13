import { createR2Client, createS3Client } from "../client";
import { R2Storage } from "./r2-operations";
import { S3Storage } from "./s3-operations";
import { Storage } from "./storage"

type Mode = "r2" | "s3"
const storageCache: Partial<Record<Mode, Storage>> = {}

export function getStorage(mode: string | null): Storage {
    console.log("Mode in the getStorage is: ", mode)
    const normalized = (mode || '') as Mode;

    if (normalized !== "r2" && normalized !== "s3") {
        throw new Error(`Invalid storage mode: ${mode}`);
    }

    if (storageCache[normalized]) return storageCache[normalized];

    if (normalized === 's3') {
        const bucket = process.env.S3_BUCKET_NAME;
        if (!bucket) throw new Error("Bucket not found or invalid");
        const client = createS3Client();
        const instance = new S3Storage(client, bucket);
        storageCache.s3 = instance
        return instance;
    }

    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) throw new Error("Bucket not found or invalid");
    const client = createR2Client();
    const instance = new R2Storage(client, bucket);
    storageCache.r2 = instance
    return instance;
}