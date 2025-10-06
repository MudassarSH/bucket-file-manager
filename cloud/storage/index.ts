import { createR2Client } from "../client";
import { R2Storage } from "./r2-operations";
import { Storage } from "./storage"

let storageInstance: Storage | null = null;

export function getStorage(): Storage {
    if (storageInstance) return storageInstance;
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) throw new Error("Bucket not found or invalid");
    const client = createR2Client();
    storageInstance = new R2Storage(client, bucket);
    return storageInstance;
}