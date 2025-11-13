import { NextResponse } from "next/server";
import { getStorage } from "@/cloud/storage";
import { buildKey, sanitizeRelativePaths } from "@/cloud/utils/helper";

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get("mode") || '';
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const path = formData.get('path') as string || '';

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 200 })
        }
        const sanitizePath = sanitizeRelativePaths(path);
        const key = buildKey(`${sanitizePath}${file.name}`);

        const buffer = Buffer.from(await file.arrayBuffer());
        const storage = getStorage(mode);

        await storage.uploadFile(key, buffer, file.type);
        return NextResponse.json({
            success: true,
            key,
            message: "File Uploaded Successfully"
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}