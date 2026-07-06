import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join, resolve, sep } from 'path';
import { Request } from 'express';

export type MemoryFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

type StoredMedia = {
  relativePath: string;
  absolutePath: string;
  mimeType: string;
  size: number;
};

const imageMimeExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const videoMimeExtensions: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
};

@Injectable()
export class MediaService {
  private readonly uploadDir: string;
  private readonly publicBaseUrl?: string;

  constructor(config: ConfigService) {
    this.uploadDir = config.get<string>('app.uploadDir', join(process.cwd(), 'uploads'));
    this.publicBaseUrl = config.get<string>('app.publicBaseUrl') || undefined;
  }

  async storeImage(file: MemoryFile, folder = 'images'): Promise<StoredMedia> {
    this.assertFile(file);
    this.assertMime(file.mimetype, imageMimeExtensions, 'image');
    if (file.size > 10 << 20) {
      throw new BadRequestException({ error: `${file.originalname} exceeds 10MB image limit` });
    }
    return this.writeBuffer(file.buffer, file.mimetype, folder, this.extensionFor(file));
  }

  async storeVideo(file: MemoryFile, folder = 'videos'): Promise<StoredMedia> {
    this.assertFile(file);
    this.assertMime(file.mimetype, videoMimeExtensions, 'video');
    if (file.size > 50 << 20) {
      throw new BadRequestException({ error: `${file.originalname} exceeds 50MB video limit` });
    }
    return this.writeBuffer(file.buffer, file.mimetype, folder, this.extensionFor(file));
  }

  async storeUpload(file: MemoryFile, folder = 'media'): Promise<StoredMedia> {
    if (file.mimetype.startsWith('image/')) {
      return this.storeImage(file, folder);
    }
    if (file.mimetype.startsWith('video/')) {
      return this.storeVideo(file, folder);
    }
    throw new BadRequestException({ error: `unsupported media type: ${file.mimetype}` });
  }

  async storeBase64Image(base64: string, imageType = 'png', folder = 'generated'): Promise<StoredMedia> {
    const normalizedType = imageType.toLowerCase().replace(/^\./, '');
    const mimeType = normalizedType === 'jpg' ? 'image/jpeg' : `image/${normalizedType}`;
    this.assertMime(mimeType, imageMimeExtensions, 'image');
    return this.writeBuffer(this.decodeBase64(base64), mimeType, folder, imageMimeExtensions[mimeType]);
  }

  publicUrl(req: Request, relativePath: string): string {
    const cleanPath = relativePath.replace(/^\/+/, '');
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${cleanPath}`;
    }
    const proto = req.header('x-forwarded-proto') || req.protocol;
    const host = req.header('x-forwarded-host') || req.get('host');
    return `${proto}://${host}/${cleanPath}`;
  }

  async deletePublicUrl(publicUrl: string | null | undefined): Promise<void> {
    const relativeUploadPath = this.relativeUploadPath(publicUrl);
    if (!relativeUploadPath) {
      return;
    }

    const uploadRoot = resolve(this.uploadDir);
    const absolutePath = resolve(uploadRoot, relativeUploadPath);
    if (absolutePath !== uploadRoot && !absolutePath.startsWith(`${uploadRoot}${sep}`)) {
      throw new BadRequestException({ error: 'invalid upload path' });
    }

    await fs.unlink(absolutePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    });
  }

  private async writeBuffer(buffer: Buffer, mimeType: string, folder: string, extension: string): Promise<StoredMedia> {
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '-');
    const fileName = `${randomUUID()}${extension}`;
    const relativePath = `uploads/${safeFolder}/${fileName}`;
    const absolutePath = join(this.uploadDir, safeFolder, fileName);
    await fs.mkdir(join(this.uploadDir, safeFolder), { recursive: true });
    await fs.writeFile(absolutePath, buffer);
    return { relativePath, absolutePath, mimeType, size: buffer.length };
  }

  private decodeBase64(value: string): Buffer {
    const base64 = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
    return Buffer.from(base64, 'base64');
  }

  private assertFile(file: MemoryFile): void {
    if (!file?.buffer?.length) {
      throw new BadRequestException({ error: 'uploaded file is empty' });
    }
  }

  private assertMime(mimeType: string, allowed: Record<string, string>, kind: string): void {
    if (!allowed[mimeType]) {
      throw new BadRequestException({ error: `unsupported ${kind} type: ${mimeType}` });
    }
  }

  private extensionFor(file: MemoryFile): string {
    const fromMime = imageMimeExtensions[file.mimetype] || videoMimeExtensions[file.mimetype];
    if (fromMime) {
      return fromMime;
    }
    const fromName = extname(file.originalname).toLowerCase();
    return fromName || '.bin';
  }

  private relativeUploadPath(publicUrl: string | null | undefined): string | null {
    if (!publicUrl) {
      return null;
    }

    let pathname = publicUrl;
    try {
      pathname = new URL(publicUrl).pathname;
    } catch {
      pathname = publicUrl;
    }

    const normalizedPathname = decodeURIComponent(pathname).replace(/\\/g, '/');
    if (normalizedPathname.startsWith('uploads/')) {
      return normalizedPathname.slice('uploads/'.length);
    }

    const marker = '/uploads/';
    const markerIndex = normalizedPathname.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    return normalizedPathname.slice(markerIndex + marker.length);
  }
}
