import { Readable } from "stream";

export interface Storage {
    readFile(key: string, opts?: { returnMeta?: boolean, asStream?: boolean }): Promise<{ text?: string, stream?: any, contentType?: string, lastModified?: Date, etag?: string } | string>,
    uploadFile(key: string, data: string | Buffer | Readable, contentType?: string): Promise<void>,
    deleteFile(key: string): Promise<void>,
    getFileInfo(key: string): Promise<{
        contentType: string,
        contentLength: number,
        lastModified?: Date,
        eTag?: string
    }>
    listPrefixes(prefix: string): Promise<{ keys: string[], commonPrefixes: string[] }>,
    getSignedUrl(key: string, expiresIn: number): Promise<string>,
}

export interface StorageContext {
    buildFileKey(relativePath: string): string;
    sanitizeRelativePaths(input: string): string;
}

export function createStorage() {
    return {
        buildFileKey(relativePath: string) {
            const rel = this.sanitizeRelativePaths(relativePath);
            return rel
        },
        sanitizeRelativePaths(input: string) {
            let cleaned = input.replace(/\\/g, '/').trim();
            if (cleaned.startsWith('/')) cleaned = cleaned.slice(1);
            cleaned = cleaned.replace(/\/+/g, '/');
            const parts: string[] = [];
            for (const segment of cleaned.split('/')) {
                if (!segment || segment === '') continue;
                if (segment === '..') throw new Error('Path traversal not allowed');
                parts.push(segment)
            }
            return parts.join('/')
        }
    }
}