<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

final class WarehouseController
{
  public static function list(PDO $pdo): void {
    $stmt = $pdo->query("SELECT * FROM warehouses ORDER BY name ASC");
    Response::ok(['warehouses' => $stmt->fetchAll()]);
  }

  public static function create(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['name']);
    if ($missing) Response::badRequest('Missing name', $missing);

    $name = trim($data['name']);
    $lat = isset($data['latitude']) ? (float)$data['latitude'] : 0.0;
    $lng = isset($data['longitude']) ? (float)$data['longitude'] : 0.0;

    try {
        $stmt = $pdo->prepare("INSERT INTO warehouses (name, latitude, longitude) VALUES (?, ?, ?)");
        $stmt->execute([$name, $lat, $lng]);
        Response::created(['message' => 'Warehouse created', 'warehouse_id' => (int)$pdo->lastInsertId()]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Integrity constraint violation
             Response::badRequest('Warehouse name already exists');
        }
        Response::serverError('Failed to create warehouse: ' . $e->getMessage());
    }
  }

  public static function update(PDO $pdo, int $id): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $name = trim((string)($data['name'] ?? ''));
    if (!$name) Response::badRequest('Name required');
    
    // Optional update for location
    $lat = isset($data['latitude']) ? (float)$data['latitude'] : null;
    $lng = isset($data['longitude']) ? (float)$data['longitude'] : null;

    try {
        if ($lat !== null && $lng !== null) {
             $stmt = $pdo->prepare("UPDATE warehouses SET name = ?, latitude = ?, longitude = ? WHERE id = ?");
             $stmt->execute([$name, $lat, $lng, $id]);
        } else {
             $stmt = $pdo->prepare("UPDATE warehouses SET name = ? WHERE id = ?");
             $stmt->execute([$name, $id]);
        }

        if ($stmt->rowCount() === 0) {
            // Check if it exists
            $check = $pdo->prepare("SELECT id FROM warehouses WHERE id = ?");
            $check->execute([$id]);
            if (!$check->fetch()) Response::notFound('Warehouse not found');
        }
        Response::ok(['message' => 'Warehouse updated']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) Response::badRequest('Name already exists');
        Response::serverError('Update failed');
    }
  }

  public static function delete(PDO $pdo, int $id): void {
    // Check for stocks
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM resource_stocks WHERE warehouse_id = ?");
    $stmt->execute([$id]);
    if ($stmt->fetchColumn() > 0) {
        Response::badRequest('Cannot delete warehouse with existing stocks. Please move or remove stocks first.');
    }

    $del = $pdo->prepare("DELETE FROM warehouses WHERE id = ?");
    $del->execute([$id]);
    if ($del->rowCount() === 0) Response::notFound('Warehouse not found');
    
    Response::ok(['message' => 'Warehouse deleted']);
  }
}
