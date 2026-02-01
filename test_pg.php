<?php
// Test with postgres superuser
try {
    $pdo = new PDO(
        'pgsql:host=127.0.0.1;port=5432;dbname=biznexa',
        'postgres',
        '', // empty password
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "SUCCESS with postgres user!\n";
    $pdo = null;
} catch (PDOException $e) {
    echo "POSTGRES USER ERROR: " . $e->getMessage() . "\n";
}

// Test with biznexa_user
try {
    $pdo = new PDO(
        'pgsql:host=127.0.0.1;port=5432;dbname=biznexa',
        'biznexa_user',
        'biznexa_secret',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "SUCCESS with biznexa_user!\n";
    $pdo = null;
} catch (PDOException $e) {
    echo "BIZNEXA_USER ERROR: " . $e->getMessage() . "\n";
}
