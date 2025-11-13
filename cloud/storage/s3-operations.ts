import { Readable } from "stream";
import { Storage } from "./storage";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Storage implements Storage {
    constructor(
        private client: S3Client,
        private bucket: string
    ) { }

    async readFile(key: string, opts?: { returnMeta?: boolean; asStream?: boolean; }): Promise<{ text?: string; stream?: Readable; contentType?: string; lastModified?: Date; etag?: string; } | string> {
        try {
            const resp = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
            if (opts?.asStream) {
                return {
                    stream: resp.Body as Readable,
                    contentType: resp.ContentType,
                    etag: resp.ETag,
                    lastModified: resp.LastModified,
                }
            }
            const text = await resp.Body!.transformToString();
            if (opts?.returnMeta) {
                return {
                    text: text,
                    contentType: resp.ContentType,
                    lastModified: resp.LastModified,
                    etag: resp.ETag
                }
            }
            return text;
        } catch (e) {
            const error = e as { $metadata: { httpStatusCode: number }; message: string }
            if (error.$metadata?.httpStatusCode === 404) return '';
            throw e;
        }
    }
    async uploadFile(key: string, data: string | Buffer | Readable, contentType?: string): Promise<void> {
        try {
            await this.client.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: data,
                ContentType: contentType || 'application/octet-stream'
            }))
        } catch (error) {
            const e = error as { message: string }
            throw new Error(`Failed to upload ${key}: ${e.message}`);
        }
    }

    async deleteFile(key: string) {
        try {
            await this.client.send(new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key
            }))
        } catch (error) {
            const e = error as { message: string }
            throw new Error(`Failed to delete ${key}: ${e.message}`);
        }
    }

    async fileExists(key: string) {
        try {
            await this.client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key
            }))
            return true
        } catch (e) {
            const error = e as { $metadata: { httpStatusCode: number }; message: string }
            if (error.$metadata?.httpStatusCode === 404) return false;
            throw new Error(`Failed to check existence of ${key}: ${error.message}`);
        }
    }

    async getFileInfo(key: string): Promise<{
        contentType: string,
        contentLength: number,
        lastModified?: Date,
        eTag?: string
    }> {
        try {
            const resp = await this.client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key
            }));
            return {
                contentLength: resp.ContentLength!,
                contentType: resp.ContentType!,
                lastModified: resp.LastModified,
                eTag: resp.ETag
            }
        } catch (error) {
            const e = error as { message: string }
            throw new Error(`Failed to get metadata for ${key}: ${e.message}`);
        }
    }

    async listPrefixes(prefix: string) {
        try {
            const keys: string[] = [];
            const commonPrefixes: string[] = [];
            let ContinuationToken: string | undefined;
            do {
                const resp = await this.client.send(new ListObjectsV2Command({
                    Bucket: this.bucket,
                    Prefix: prefix,
                    Delimiter: '/',
                    ContinuationToken
                }));
                (resp.Contents || []).forEach(p => { if (p.Key && p.Key !== prefix) keys.push(p.Key) });
                (resp.CommonPrefixes || []).forEach(p => { if (p.Prefix) commonPrefixes.push(p.Prefix) });
                ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
            } while (ContinuationToken);
            return { keys, commonPrefixes }
        } catch (e) {
            const error = e as { $metadata: { httpStatusCode: number }; message: string; code: string }
            if (error?.$metadata?.httpStatusCode === 404 || error?.code === 'NoSuchKey') {
                return { keys: [], commonPrefixes: [] };
            }
            throw e;
        }
    }

    async getSignedUrl(key: string, expiresIn: number = 36000): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key
            })
            return await getSignedUrl(this.client, command, { expiresIn })
        } catch (error) {
            const e = error as { message: string }
            throw new Error(`Failed to generate signed URL for ${key}: ${e.message}`);
        }
    }
}