/**
 * File Upload Routes
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/connection');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const subDir = path.join(uploadDir, new Date().toISOString().split('T')[0]);
        if (!fs.existsSync(subDir)) {
            fs.mkdirSync(subDir, { recursive: true });
        }
        cb(null, subDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Неподдерживаемый тип файла: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxSize,
        files: 10
    }
});

router.use(authenticate);

/**
 * POST /files/upload
 * Upload single file
 */
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
        throw ApiError.badRequest('Файл не предоставлен');
    }

    const relativePath = req.file.path.replace(uploadDir, '').replace(/\\/g, '/');
    const url = `/uploads${relativePath}`;

    res.json({
        success: true,
        file: {
            name: req.file.originalname,
            url,
            type: req.file.mimetype,
            size: req.file.size
        }
    });
}));

/**
 * POST /files/upload-multiple
 * Upload multiple files
 */
router.post('/upload-multiple', upload.array('files', 10), asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        throw ApiError.badRequest('Файлы не предоставлены');
    }

    const files = req.files.map(file => {
        const relativePath = file.path.replace(uploadDir, '').replace(/\\/g, '/');
        return {
            name: file.originalname,
            url: `/uploads${relativePath}`,
            type: file.mimetype,
            size: file.size
        };
    });

    res.json({
        success: true,
        files
    });
}));

/**
 * POST /files/project/:projectId
 * Upload file to project
 */
router.post('/project/:projectId', upload.single('file'), asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!req.file) {
        throw ApiError.badRequest('Файл не предоставлен');
    }

    // Check project access
    const projectResult = await query(
        `SELECT * FROM engineer_projects WHERE id = $1 AND (engineer_id = $2 OR customer_id = $2)`,
        [projectId, req.user.id]
    );

    if (projectResult.rows.length === 0) {
        throw ApiError.notFound('Проект не найден');
    }

    const relativePath = req.file.path.replace(uploadDir, '').replace(/\\/g, '/');
    const url = `/uploads${relativePath}`;

    // Save to database
    const result = await query(
        `INSERT INTO project_files (project_id, name, url, type, size_bytes, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, created_at`,
        [projectId, req.file.originalname, url, req.file.mimetype, req.file.size, req.user.id]
    );

    res.status(201).json({
        success: true,
        file: {
            id: result.rows[0].id,
            name: req.file.originalname,
            url,
            type: req.file.mimetype,
            size: req.file.size,
            createdAt: result.rows[0].created_at
        }
    });
}));

/**
 * DELETE /files/:id
 * Delete file
 */
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find file
    const result = await query(
        `SELECT pf.*, ep.engineer_id, ep.customer_id FROM project_files pf
         JOIN engineer_projects ep ON pf.project_id = ep.id
         WHERE pf.id = $1 AND (ep.engineer_id = $2 OR ep.customer_id = $2)`,
        [id, req.user.id]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Файл не найден');
    }

    const file = result.rows[0];

    // Delete from filesystem
    const filePath = path.join(uploadDir, file.url.replace('/uploads', ''));
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Delete from database
    await query(`DELETE FROM project_files WHERE id = $1`, [id]);

    res.json({ success: true, message: 'Файл удалён' });
}));

// Error handler for multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: { message: `Файл слишком большой. Максимум: ${config.upload.maxSize / 1024 / 1024}MB` }
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: { message: 'Слишком много файлов' }
            });
        }
    }
    next(err);
});

module.exports = router;
