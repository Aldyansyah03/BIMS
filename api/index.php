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

// Reset SCRIPT_NAME agar Symfony Request tidak menganggap /api sebagai subfolder/baseUrl
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/../public/index.php';

// Teruskan eksekusi ke index.php publik milik Laravel
require __DIR__ . '/../public/index.php';
