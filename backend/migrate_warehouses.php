<?php
require_once __DIR__ . '/config/database.php';
// This script migrates the existing `location` column in `resource_stocks` to a new `warehouses` table.

try {
    echo "Starting migration...\n";

    // 1. Create table
    $pdo->exec("CREATE TABLE IF NOT EXISTS warehouses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "Created warehouses table.\n";

    // 2. Insert unique locations
    $locations = $pdo->query("SELECT DISTINCT location FROM resource_stocks WHERE location IS NOT NULL AND location != ''")->fetchAll(PDO::FETCH_COLUMN);
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO warehouses (name) VALUES (?)");
    foreach ($locations as $loc) {
        $stmt->execute([$loc]);
        echo "Inserted warehouse: $loc\n";
    }

    // 3. Add column
    // Check if column exists first
    $colCheck = $pdo->query("SHOW COLUMNS FROM resource_stocks LIKE 'warehouse_id'");
    if (!$colCheck->fetch()) {
        $pdo->exec("ALTER TABLE resource_stocks ADD COLUMN warehouse_id INT NULL AFTER resource_id");
        echo "Added warehouse_id column.\n";
    }

    // 4. Update data
    $pdo->exec("UPDATE resource_stocks rs 
                JOIN warehouses w ON rs.location = w.name 
                SET rs.warehouse_id = w.id");
    echo "Updated resource_stocks with warehouse_id.\n";

    // 5. Make nullable/strict? 
    // Ideally we drop the old column, but let's just leave it for safety for now or rename.
    // Let's drop it to force usage of new column
    $pdo->exec("ALTER TABLE resource_stocks DROP COLUMN location");
    echo "Dropped old location column.\n";

    echo "Migration complete.\n";

} catch (PDOException $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
