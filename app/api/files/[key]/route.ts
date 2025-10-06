import { NextResponse } from "next/server";
import { getStorage } from "@/cloud/storage";

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
    try {
        const { key } = await params;
        const decoode = decodeURIComponent(key);
        const storage = getStorage();
        const signedUrl = await storage.getSignedUrl(decoode, 3600);
        return NextResponse.json({ url: signedUrl })
    } catch (error) {
        console.error('Error getting file:', error);
        return NextResponse.json(
            { error: 'Failed to get file' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ key: string }> }) {
    try {
        const { key } = await params;
        const decoode = decodeURIComponent(key);
        const storage = getStorage();
        await storage.deleteFile(decoode);
        return NextResponse.json({
            success: true,
            message: 'File Deleted SUccessfully'
        })
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json(
            { error: 'Failed to delete file' },
            { status: 500 }
        );
    }
}