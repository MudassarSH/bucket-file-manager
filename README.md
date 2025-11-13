# Cloud File Manager

A modern, flexible file management system built with Next.js that supports both Amazon S3 and Cloudflare R2 storage backends.

## Overview

This file manager provides a complete solution for managing files in the cloud with a clean, responsive interface. The system allows users to upload, download, view, and delete files through an intuitive web interface while handling all the complexity of cloud storage behind the scenes.

## Key Features

- **Multi-Cloud Support**: Works with both Amazon S3 and Cloudflare R2 storage backends with just through the select
- **Complete File Operations**: Upload, download, view, and delete files
- **Folder Operations**: Upload, download, view, and delete inside the folder.
- **Folder Organization**: Navigate through folder structures
- **Storage Statistics**: View storage usage by file type
- **Responsive Design**: Works on both desktop and mobile devices
- **Secure File Access**: Uses signed URLs for secure file access

## Backend Architecture

The file manager is built with a modular architecture that abstracts the underlying storage provider:

### Storage Interface

The system uses a common interface for storage operations, allowing it to work with different storage providers:

```typescript
interface Storage {
    readFile(key: string, opts?: { returnMeta?: boolean, asStream?: boolean }): Promise<...>;
    uploadFile(key: string, data: string | Buffer | Readable, contentType?: string): Promise<void>;
    deleteFile(key: string): Promise<void>;
    getFileInfo(key: string): Promise<{ contentType: string, contentLength: number, ... }>;
    listPrefixes(prefix: string): Promise<{ keys: string[], commonPrefixes: string[] }>;
    getSignedUrl(key: string, expiresIn: number): Promise<string>;
}
```

### Storage Implementation

The system currently implements R2 storage using AWS SDK S3 client (since R2 is S3-compatible):

- **R2Storage**: Implements the Storage interface for Cloudflare R2
- **S3Storage**: Implements the Storage interface for Amazon S3
- **Storage Factory**: A factory pattern is used to create and configure storage instances

### API Endpoints

The system provides RESTful API endpoints for file operations:

- **GET /api/files**: Lists all files and folders
- **POST /api/files/upload**: Uploads new files
- **GET /api/files/[key]**: Generates a signed URL for file download
- **DELETE /api/files/[key]**: Deletes a file
- **GET /api/files/storage/stats**: Provides storage usage statistics

### Security Features

- **Path Sanitization**: Prevents path traversal attacks
- **Temporary URLs**: Uses signed URLs with expiration for secure file access
- **Content Type Detection**: Automatically detects and sets appropriate content types

## Use Cases

This file manager is particularly useful for:

1. **Content Management Systems**: Manage media files for websites and applications
2. **Document Management**: Store and organize business documents securely
3. **Media Libraries**: Organize photos, videos, and audio files
4. **Application Asset Storage**: Store and serve assets for web and mobile applications
5. **Team Collaboration**: Share files within teams with controlled access
6. **Backup Solutions**: Create and manage backups of important files

## Benefits of the Architecture

1. **Provider Flexibility**: Switch between S3 and R2 without changing application code
2. **Cost Optimization**: Use R2 to avoid egress fees associated with S3
3. **Scalability**: Cloud storage backends handle scaling automatically
4. **Performance**: Leverages cloud provider CDNs for fast content delivery
5. **Security**: Implements best practices for secure file access

## Environment Setup

To use this file manager, you need to configure the following environment variables:

For R2:
```
R2_API_ENDPOINT=your-r2-endpoint
R2_ACCESS_KEY=your-access-key
R2_ACCESS_SECRET=your-access-secret
R2_BUCKET_NAME=your-bucket-name
```

For S3:
```
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
```

## Getting Started

First, clone the directory:

```bash
git clone https://github.com/MudassarSH/bucket-file-manager.git
```
Install all the dependencies through:

```bash
npm run install
# or
npm run i
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.