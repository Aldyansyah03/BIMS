<?php

// Pastikan direktori sementara di /tmp dibuat untuk kebutuhan runtime serverless Vercel
$storageDirs = [
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/logs',
    '/tmp/storage/app',
    '/tmp/bootstrap/cache',
];

foreach ($storageDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Teruskan eksekusi ke index.php publik milik Laravel
require __DIR__ . '/../public/index.php';

