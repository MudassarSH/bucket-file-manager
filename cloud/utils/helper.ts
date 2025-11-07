import { createStorage } from "../storage/storage";


const ctx = createStorage();

export function buildKey(relativePath: string):string {
    return ctx.buildFileKey(relativePath)
}

export function sanitizeRelativePaths(input: string) {
    return ctx.sanitizeRelativePaths(input)
}

export function ensureTrailingSlash(input: string) {
    return input.endsWith('/') ? input : input + '/'
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]

}

export function getFileType(contentType: string): string {
    if (contentType.startsWith('image/')) return 'Image';
    if (contentType.startsWith('video/')) return 'Video';
    if (contentType.startsWith('audio/')) return 'Audio';
    if (contentType.includes('zip') || contentType.includes('compressed')) return 'ZIP';
    return 'Document'
}