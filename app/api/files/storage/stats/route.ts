import { NextResponse } from "next/server";
import { getStorage } from "@/cloud/storage";
import { formatFileSize, getFileType } from "@/cloud/utils/helper";


export async function GET() {
    try {
        const storage = getStorage();
        const { keys } = await storage.listPrefixes('');

        const stats = {
            Document: { files: 0, size: 0 },
            Image: { files: 0, size: 0 },
            Video: { files: 0, size: 0 },
            Audio: { files: 0, size: 0 },
            ZIP: { files: 0, size: 0 }
        }

        await Promise.all(
            keys.map(async (key) => {
                const metadata = await storage.getFileInfo(key);
                const type = getFileType(metadata.contentType || '');

                if (stats[type as keyof typeof stats]) {
                    stats[type as keyof typeof stats].files++;
                    stats[type as keyof typeof stats].size += metadata.contentLength || 0
                }
            })
        )
        const formattedStats = Object.entries(stats).map(([type, data]) => ({
            type,
            files: data.files,
            size: formatFileSize(data.size)
        }))

        return NextResponse.json(formattedStats);
    } catch (error) {
        console.error('Error getting storage stats:', error);
        return NextResponse.json(
            { error: 'Failed to get storage stats' },
            { status: 500 }
        );
    }
}