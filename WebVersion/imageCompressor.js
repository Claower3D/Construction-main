/**
 * ImageCompressor — сжатие изображений перед загрузкой
 * QazGost AI — Оптимизация трафика и скорости
 */
(function () {
    'use strict';

    const DEFAULT_OPTIONS = {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.82,
        type: 'image/jpeg',
        maxSizeMB: 2
    };

    /**
     * Сжать изображение (File → File)
     * @param {File} file — исходный файл
     * @param {object} options — параметры сжатия
     * @returns {Promise<File>} сжатый файл
     */
    async function compress(file, options = {}) {
        const opts = { ...DEFAULT_OPTIONS, ...options };

        // Пропускаем не-изображения
        if (!file.type.startsWith('image/')) return file;

        // Если файл уже маленький — не сжимаем
        if (file.size <= opts.maxSizeMB * 1024 * 1024 * 0.5) return file;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);

                let { width, height } = img;

                // Ресайз если превышает лимиты
                if (width > opts.maxWidth || height > opts.maxHeight) {
                    const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file); // fallback
                            return;
                        }

                        const compressed = new File(
                            [blob],
                            file.name.replace(/\.\w+$/, '.jpg'),
                            { type: opts.type, lastModified: Date.now() }
                        );

                        const savings = ((1 - compressed.size / file.size) * 100).toFixed(0);
                        console.log(
                            `[ImageCompressor] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB (-${savings}%)`
                        );

                        resolve(compressed);
                    },
                    opts.type,
                    opts.quality
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(file); // fallback — возвращаем исходный
            };

            img.src = url;
        });
    }

    /**
     * Сжать массив файлов
     * @param {File[]} files
     * @param {object} options
     * @returns {Promise<File[]>}
     */
    async function compressMultiple(files, options = {}) {
        const results = [];
        for (const file of files) {
            results.push(await compress(file, options));
        }
        return results;
    }

    /**
     * Получить размер в человекочитаемом формате
     */
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ========== ЭКСПОРТ ==========
    window.ImageCompressor = {
        compress,
        compressMultiple,
        formatSize,
        DEFAULT_OPTIONS
    };

    console.log('[ImageCompressor] ✅ Module loaded');
})();
