<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/NotificationManager.php';

final class IncidentController
{
  private const DISASTER_TYPES = ['FLOOD','CYCLONE','FIRE','LANDSLIDE','EARTHQUAKE'];
  private const SEVERITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];
  private const STATUSES = ['REPORTED','IN_PROGRESS','RESOLVED'];

  public static function create(PDO $pdo, int $userId): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['title','disaster_type','severity','latitude','longitude']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $title = trim((string)$data['title']);
    $desc = isset($data['description']) ? (string)$data['description'] : null;

    $dtype = strtoupper(trim((string)$data['disaster_type']));
    $sev = strtoupper(trim((string)$data['severity']));
    $lat = Validator::asFloat($data['latitude']);
    $lng = Validator::asFloat($data['longitude']);

    if (!Validator::inEnum($dtype, self::DISASTER_TYPES)) Response::badRequest('Invalid disaster_type');
    if (!Validator::inEnum($sev, self::SEVERITIES)) Response::badRequest('Invalid severity');
    if ($lat === null || $lng === null || $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
      Response::badRequest('Invalid latitude/longitude');
    }

    try {
      $stmt = $pdo->prepare("INSERT INTO incidents
        (title, description, disaster_type, severity, latitude, longitude, reported_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)");
      $stmt->execute([$title, $desc, $dtype, $sev, $lat, $lng, $userId]);

      $newIncidentId = (int)$pdo->lastInsertId();

      // Trigger Notification
      NotificationManager::sendGlobal($pdo, "New Incident Reported: $title", "A new $dtype incident ($sev) has been reported.", 'ALERT');

      Response::created(['message' => 'Incident reported', 'incident_id' => $newIncidentId]);
    } catch (PDOException $e) {
      Response::serverError('Failed to create incident');
    }
  }

  public static function list(PDO $pdo): void {
    $status = isset($_GET['status']) ? strtoupper(trim((string)$_GET['status'])) : null;

    if ($status && !Validator::inEnum($status, self::STATUSES)) {
      Response::badRequest('Invalid status filter');
    }

    $sql = "SELECT i.*, u.user_name AS reporter_name
            FROM incidents i
            LEFT JOIN users u ON u.user_id = i.reported_by";
    $params = [];

    if ($status) {
      $sql .= " WHERE i.status = ?";
      $params[] = $status;
    }

    $sql .= " ORDER BY i.created_at DESC LIMIT 200";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    Response::ok(['incidents' => $stmt->fetchAll()]);
  }

  public static function get(PDO $pdo, int $id): void {
    $stmt = $pdo->prepare("SELECT i.*, u.user_name AS reporter_name
                           FROM incidents i
                           LEFT JOIN users u ON u.user_id = i.reported_by
                           WHERE i.id = ?");
    $stmt->execute([$id]);
    $incident = $stmt->fetch();
    if (!$incident) Response::notFound('Incident not found');

    $u = $pdo->prepare("SELECT iu.*, u.user_name AS updater_name
                        FROM incident_updates iu
                        LEFT JOIN users u ON u.user_id = iu.updated_by
                        WHERE iu.incident_id = ?
                        ORDER BY iu.updated_at DESC");
    $u->execute([$id]);

    Response::ok(['incident' => $incident, 'updates' => $u->fetchAll()]);
  }

  public static function updateStatus(PDO $pdo, int $incidentId): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['status']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $status = strtoupper(trim((string)$data['status']));
    if (!Validator::inEnum($status, self::STATUSES)) Response::badRequest('Invalid status');

    $stmt = $pdo->prepare("UPDATE incidents SET status = ? WHERE id = ?");
    $stmt->execute([$status, $incidentId]);

    if ($stmt->rowCount() === 0) Response::notFound('Incident not found');

    // If resolved, free up volunteers
    if ($status === 'RESOLVED') {
      // Find volunteers assigned to this incident
      $vsql = "SELECT va.volunteer_id, v.user_id 
               FROM volunteer_assignments va
               JOIN volunteers v ON v.id = va.volunteer_id
               WHERE va.incident_id = ?";
      $vstmt = $pdo->prepare($vsql);
      $vstmt->execute([$incidentId]);
      $volunteers = $vstmt->fetchAll(PDO::FETCH_ASSOC);

      if (!empty($volunteers)) {
        // Update their status to AVAILABLE
        $ids = implode(',', array_map(fn($v) => (int)$v['volunteer_id'], $volunteers));
        $pdo->exec("UPDATE volunteers SET availability = 'AVAILABLE' WHERE id IN ($ids)");

        // NOTIFY Volunteers: Mission Complete
        foreach ($volunteers as $vol) {
            NotificationManager::sendToUser($pdo, (int)$vol['user_id'], 'Mission Complete!', 'The incident you were assigned to has been resolved. Great work!', 'INFO');
        }
      }
    }

    Response::ok(['message' => 'Status updated']);
  }

  public static function addUpdate(PDO $pdo, int $userId, int $incidentId): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['update_message']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $msg = trim((string)$data['update_message']);
    if ($msg === '') Response::badRequest('Update message cannot be empty');

    // ensure incident exists
    $chk = $pdo->prepare("SELECT id FROM incidents WHERE id = ?");
    $chk->execute([$incidentId]);
    if (!$chk->fetch()) Response::notFound('Incident not found');

    $stmt = $pdo->prepare("INSERT INTO incident_updates (incident_id, update_message, updated_by)
                           VALUES (?, ?, ?)");
    $stmt->execute([$incidentId, $msg, $userId]);

    Response::created(['message' => 'Update added', 'update_id' => (int)$pdo->lastInsertId()]);
  }
}
