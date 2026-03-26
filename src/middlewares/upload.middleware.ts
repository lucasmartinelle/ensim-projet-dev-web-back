import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'games');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req: Request, _file, cb) => {
        const slug = req.params.slug ?? 'game';
        const ext = path.extname(_file.originalname).toLowerCase();
        cb(null, `${slug}-${Date.now()}${ext}`);
    },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.'));
    }
}

export const uploadCoverMiddleware = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single('cover');
