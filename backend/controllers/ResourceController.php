<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

final class ResourceController
{
  public static function createResource(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['resource_name', 'unit', 'type']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    try {
      $stmt = $pdo->prepare("INSERT INTO resources (resource_name, unit, type) VALUES (?, ?, ?)");
      $stmt->execute([trim((string)$data['resource_name']), trim((string)$data['unit']), trim((string)$data['type'])]);
      Response::created(['message' => 'Resource created', 'resource_id' => (int)$pdo->lastInsertId()]);
    } catch (PDOException $e) {
      Response::badRequest('Resource creation failed (maybe duplicate name?) ' . $e->getMessage());
    }
  }

  public static function listResources(PDO $pdo): void {
    $stmt = $pdo->query("SELECT * FROM resources ORDER BY resource_name ASC");
    Response::ok(['resources' => $stmt->fetchAll()]);
  }

  public static function addStock(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['resource_id','quantity','warehouse_id']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $rid = Validator::asInt($data['resource_id']);
    $qty = Validator::asInt($data['quantity']);
    $wid = Validator::asInt($data['warehouse_id']);

    if ($rid === null || $qty === null || $qty < 0 || $wid === null) Response::badRequest('Invalid input');

    // 1. Get Unit
    $stmt = $pdo->prepare("SELECT unit FROM resources WHERE id = ?");
    $stmt->execute([$rid]);
    $unitRaw = $stmt->fetchColumn();
    if (!$unitRaw) Response::badRequest('Invalid resource_id');
    
    $unit = strtolower(trim($unitRaw));
    $limit = ($unit === 'kg') ? 1000 : 2000;

    // 2. Check Existing Total in this warehouse
    $chk = $pdo->prepare("SELECT SUM(quantity) FROM resource_stocks WHERE resource_id = ? AND warehouse_id = ?");
    $chk->execute([$rid, $wid]);
    $currentTotal = (int)$chk->fetchColumn();

    if (($currentTotal + $qty) > $limit) {
        Response::badRequest("Exceeds warehouse limit. Unit: $unitRaw, Limit: $limit, Current: $currentTotal, Trying to add: $qty");
    }

    $stmt = $pdo->prepare("INSERT INTO resource_stocks (resource_id, quantity, warehouse_id) VALUES (?, ?, ?)");
    $stmt->execute([$rid, $qty, $wid]);

    Response::created(['message' => 'Stock added', 'stock_id' => (int)$pdo->lastInsertId()]);
  }

  public static function listStocks(PDO $pdo): void {
    // Join with warehouses table to get the name as 'location' for frontend compatibility
    $stmt = $pdo->query("SELECT rs.*, r.resource_name, r.unit, w.name as location
                         FROM resource_stocks rs
                         JOIN resources r ON r.id = rs.resource_id
                         JOIN warehouses w ON w.id = rs.warehouse_id
                         ORDER BY rs.last_updated DESC");
    Response::ok(['stocks' => $stmt->fetchAll()]);
  }

  public static function updateStock(PDO $pdo, int $id): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $qty = isset($data['quantity']) ? Validator::asInt($data['quantity']) : null;
    
    if ($qty === null || $qty < 0) {
        Response::badRequest('Invalid quantity');
    }

    // Get stock info (resource_id, warehouse_id)
    $stmt = $pdo->prepare("SELECT s.resource_id, s.warehouse_id, r.unit 
                           FROM resource_stocks s 
                           JOIN resources r ON r.id = s.resource_id 
                           WHERE s.id = ?");
    $stmt->execute([$id]);
    $info = $stmt->fetch();
    
    if (!$info) Response::notFound('Stock not found');
    
    $unit = strtolower(trim($info['unit']));
    $limit = ($unit === 'kg') ? 1000 : 2000;

    // Check existing excluding this row
    $chk = $pdo->prepare("SELECT SUM(quantity) FROM resource_stocks WHERE resource_id = ? AND warehouse_id = ? AND id != ?");
    $chk->execute([$info['resource_id'], $info['warehouse_id'], $id]);
    $otherTotal = (int)$chk->fetchColumn();

    if (($otherTotal + $qty) > $limit) {
         Response::badRequest("Exceeds warehouse limit. Unit: {$info['unit']}, Limit: $limit, Others: $otherTotal, New Total: " . ($otherTotal + $qty));
    }

    $stmt = $pdo->prepare("UPDATE resource_stocks SET quantity = ? WHERE id = ?");
    $stmt->execute([$qty, $id]);

    Response::ok(['message' => 'Stock updated']);
  }

  public static function deploy(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['stock_id','incident_id','quantity']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $sid = Validator::asInt($data['stock_id']);
    $iid = Validator::asInt($data['incident_id']);
    $qty = Validator::asInt($data['quantity']);

    if ($sid === null || $iid === null || $qty === null || $qty <= 0) {
      Response::badRequest('Invalid stock_id/incident_id/quantity');
    }

    // Check incident status
    $stmt = $pdo->prepare("SELECT status FROM incidents WHERE id = ?");
    $stmt->execute([$iid]);
    $status = $stmt->fetchColumn();

    if ($status === 'RESOLVED') {
        Response::badRequest('Cannot deploy resources to a resolved incident.');
    }

    try {
      $pdo->beginTransaction();

      // 1. Get stock & lock
      $stmt = $pdo->prepare("SELECT id, resource_id, quantity FROM resource_stocks WHERE id = ?"); // FOR UPDATE if supported
      $stmt->execute([$sid]);
      $stock = $stmt->fetch();

      if (!$stock) {
        $pdo->rollBack();
        Response::notFound('Stock not found');
      }

      if ($stock['quantity'] < $qty) {
        $pdo->rollBack();
        Response::badRequest('Not enough stock available', ['available' => $stock['quantity']]);
      }

      // 2. Deduct stock
      $upd = $pdo->prepare("UPDATE resource_stocks SET quantity = quantity - ? WHERE id = ?");
      $upd->execute([$qty, $sid]);

      // 3. Record deployment
      $ins = $pdo->prepare("INSERT INTO resource_deployments (resource_id, incident_id, quantity) VALUES (?, ?, ?)");
      $ins->execute([$stock['resource_id'], $iid, $qty]);

      $pdo->commit();
      Response::created(['message' => 'Resource deployed and stock updated', 'deployment_id' => (int)$pdo->lastInsertId()]);

    } catch (Exception $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      Response::serverError('Deployment failed: ' . $e->getMessage());
    }
  }

  public static function listDeployments(PDO $pdo): void {
    $stmt = $pdo->query("SELECT rd.*, r.resource_name, i.title AS incident_title
                         FROM resource_deployments rd
                         JOIN resources r ON r.id = rd.resource_id
                         JOIN incidents i ON i.id = rd.incident_id
                         ORDER BY rd.deployed_at DESC");
    Response::ok(['deployments' => $stmt->fetchAll()]);
  }
}

