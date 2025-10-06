import { NextResponse } from "next/server";
import { getStorage } from "@/cloud/storage";
import { formatFileSize, getFileType } from "@/cloud/utils/helper";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const prefix = searchParams.get('prefix') || '';
        const storage = getStorage();
        const { keys, commonPrefixes } = await storage.listPrefixes(prefix);

        const files = await Promise.all(
            keys.map(async (key) => {
                const metadata = await storage.getFileInfo(key);
                return {
                    name: key.split('/').pop(),
                    key,
                    size: formatFileSize(metadata.contentLength || 0),
                    lastModified: metadata.lastModified,
                    type: getFileType(metadata.contentType || '')
                }
            })
        )

        return NextResponse.json({ files, folders: commonPrefixes })
    } catch (error) {
        console.error('Error listing files:', error);
        return NextResponse.json(
            { error: 'Failed to list files' },
            { status: 500 }
        );
    }
}