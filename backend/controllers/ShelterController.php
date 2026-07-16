<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

final class ShelterController
{
  public static function create(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['name','location','capacity']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $cap = Validator::asInt($data['capacity']);
    if ($cap === null || $cap < 0) Response::badRequest('Invalid capacity');

    $stmt = $pdo->prepare("INSERT INTO shelters (name, location, capacity) VALUES (?, ?, ?)");
    $stmt->execute([trim((string)$data['name']), trim((string)$data['location']), $cap]);

    Response::created(['message' => 'Shelter created', 'shelter_id' => (int)$pdo->lastInsertId()]);
  }

  public static function list(PDO $pdo): void {
    $stmt = $pdo->query("SELECT * FROM shelters ORDER BY name ASC");
    Response::ok(['shelters' => $stmt->fetchAll()]);
  }

  public static function logOccupancy(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['shelter_id','person_name','action']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $sid = Validator::asInt($data['shelter_id']);
    $name = trim((string)$data['person_name']);
    $action = strtoupper(trim((string)$data['action']));

    if ($sid === null) Response::badRequest('Invalid shelter_id');
    if (!in_array($action, ['IN','OUT'], true)) Response::badRequest('Invalid action');

    try {
      $pdo->beginTransaction();

      // Lock the shelter row to prevent race conditions
      $lock = $pdo->prepare("SELECT id, current_occupancy, capacity FROM shelters WHERE id = ? FOR UPDATE");
      $lock->execute([$sid]);
      $shelter = $lock->fetch();
      if (!$shelter) {
          $pdo->rollBack();
          Response::notFound("Shelter not found");
          return;
      }

      if ($action === 'IN' && $shelter['current_occupancy'] >= $shelter['capacity']) {
          $pdo->rollBack();
          Response::badRequest("Shelter is full. Cannot check in.");
          return;
      }

      // Check last status of this person
      $last = $pdo->prepare("SELECT action FROM shelter_occupancy_logs 
                             WHERE shelter_id = ? AND person_name = ? 
                             ORDER BY id DESC LIMIT 1");
      $last->execute([$sid, $name]);
      $lastAction = $last->fetchColumn(); 

      if ($action === 'IN' && $lastAction === 'IN') {
        $pdo->rollBack();
        Response::badRequest("Person is already checked in.");
        return;
      }
      if ($action === 'OUT' && ($lastAction === 'OUT' || !$lastAction)) {
        $pdo->rollBack();
        Response::badRequest("Person is not checked in.");
        return;
      }

      $stmt = $pdo->prepare("INSERT INTO shelter_occupancy_logs (shelter_id, person_name, action) VALUES (?, ?, ?)");
      $stmt->execute([$sid, $name, $action]);

      // Automatic update removed as per request
      
      $pdo->commit();
      Response::created(['message' => 'Occupancy log added', 'log_id' => (int)$pdo->lastInsertId()]);
    } catch (Exception $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      Response::serverError("Failed to log occupancy");
    }
  }

  public static function adjustOccupancy(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['shelter_id', 'delta']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $sid = Validator::asInt($data['shelter_id']);
    $delta = Validator::asInt($data['delta']);

    if ($sid === null || $delta === null || !in_array($delta, [1, -1], true)) {
        Response::badRequest('Invalid values');
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT current_occupancy, capacity FROM shelters WHERE id = ? FOR UPDATE");
        $stmt->execute([$sid]);
        $shelter = $stmt->fetch();

        if (!$shelter) {
            $pdo->rollBack();
            Response::notFound('Shelter not found');
        }

        if ($delta > 0 && $shelter['current_occupancy'] >= $shelter['capacity']) {
             $pdo->rollBack();
             Response::badRequest('Shelter has reached maximum capacity.');
        }

        $sql = $delta > 0 
            ? "UPDATE shelters SET current_occupancy = current_occupancy + 1 WHERE id = ?"
            : "UPDATE shelters SET current_occupancy = GREATEST(current_occupancy - 1, 0) WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$sid]);

        $pdo->commit();
        Response::ok(['message' => 'Occupancy adjusted']);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        Response::serverError('Adjustment failed');
    }
  }

  public static function logs(PDO $pdo, int $shelterId): void {
    $stmt = $pdo->prepare("SELECT * FROM shelter_occupancy_logs
                           WHERE shelter_id = ?
                           ORDER BY logged_at DESC");
    $stmt->execute([$shelterId]);
    Response::ok(['logs' => $stmt->fetchAll()]);
  }

  public static function getResidents(PDO $pdo, int $shelterId): void {
    // efficient query to get people whose last action is IN
    $sql = "
      SELECT p.person_name, p.logged_at
      FROM shelter_occupancy_logs p
      INNER JOIN (
          SELECT person_name, MAX(id) as max_id
          FROM shelter_occupancy_logs
          WHERE shelter_id = ?
          GROUP BY person_name
      ) m ON p.person_name = m.person_name AND p.id = m.max_id
      WHERE p.action = 'IN'
      ORDER BY p.person_name ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$shelterId]);
    Response::ok(['residents' => $stmt->fetchAll()]);
  }

  public static function get(PDO $pdo, int $id): void {
    $stmt = $pdo->prepare("SELECT * FROM shelters WHERE id = ?");
    $stmt->execute([$id]);
    $shelter = $stmt->fetch();

    if (!$shelter) Response::notFound('Shelter not found');
    Response::ok(['shelter' => $shelter]);
  }

  public static function update(PDO $pdo, int $id): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    
    $fields = [];
    $values = [];

    if (isset($data['name'])) { $fields[] = 'name = ?'; $values[] = trim((string)$data['name']); }
    if (isset($data['location'])) { $fields[] = 'location = ?'; $values[] = trim((string)$data['location']); }
    if (isset($data['capacity'])) { $fields[] = 'capacity = ?'; $values[] = (int)$data['capacity']; }
    if (isset($data['current_occupancy'])) { $fields[] = 'current_occupancy = ?'; $values[] = (int)$data['current_occupancy']; }

    if (empty($fields)) {
      Response::badRequest('No fields to update');
    }

    $values[] = $id;
    $sql = "UPDATE shelters SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    Response::ok(['message' => 'Shelter updated']);
  }
}
