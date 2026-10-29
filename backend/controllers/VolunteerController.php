<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

final class VolunteerController
{
  public static function createProfile(PDO $pdo, int $userId): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['latitude','longitude']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $lat = Validator::asFloat($data['latitude']);
    $lng = Validator::asFloat($data['longitude']);
    if ($lat === null || $lng === null || $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
      Response::badRequest('Invalid latitude/longitude');
    }

    try {
      $stmt = $pdo->prepare("INSERT INTO volunteers (user_id, latitude, longitude) VALUES (?, ?, ?)");
      $stmt->execute([$userId, $lat, $lng]);
      Response::created(['message' => 'Volunteer profile created', 'volunteer_id' => (int)$pdo->lastInsertId()]);
    } catch (PDOException $e) {
      Response::badRequest('Volunteer profile may already exist for this user');
    }
  }

  public static function getMe(PDO $pdo, int $userId): void {
    $stmt = $pdo->prepare("SELECT * FROM volunteers WHERE user_id = ?");
    $stmt->execute([$userId]);
    $vol = $stmt->fetch();
    if (!$vol) Response::notFound('Volunteer profile not found');

    // --- Gamification Stats Calculation ---
    $vid = $vol['id'];

    // 1. Missions (Resolved Incidents)
    $mStmt = $pdo->prepare("SELECT COUNT(DISTINCT va.incident_id) 
                            FROM volunteer_assignments va
                            JOIN incidents i ON i.id = va.incident_id
                            WHERE va.volunteer_id = ? AND i.status = 'RESOLVED'");
    $mStmt->execute([$vid]);
    $missions = (int)$mStmt->fetchColumn();

    // 2. Hours Served (Heuristic: 4 hours per resolved mission)
    $hours = $missions * 4;

    // 3. XP Calculation
    // Base: 150 XP per mission + 10 XP per hour
    // Skills: 100 XP per skill
    $xp = ($missions * 150) + ($hours * 10);
    
    $sStmt = $pdo->prepare("SELECT COUNT(*) FROM volunteer_skills WHERE volunteer_id = ?");
    $sStmt->execute([$vid]);
    $skillCount = (int)$sStmt->fetchColumn();
    $xp += ($skillCount * 100);

    // 4. Rank Calculation
    $rank = 'ROOKIE';
    $nextRank = 'GUARDIAN';
    $xpToNext = 500 - $xp;  // 0 - 500

    if ($xp >= 2000) {
        $rank = 'LEGEND';
        $nextRank = 'MAX';
        $xpToNext = 0;
    } elseif ($xp >= 500) {
        $rank = 'GUARDIAN';
        $nextRank = 'LEGEND';
        $xpToNext = 2000 - $xp; // 500 - 2000
    }

    if ($xpToNext < 0) $xpToNext = 0;

    // 5. Badges Logic
    $badges = [];

    // Badge: Aqua Guard (Participated in Flood)
    $floodStmt = $pdo->prepare("SELECT COUNT(DISTINCT va.incident_id) 
                                FROM volunteer_assignments va
                                JOIN incidents i ON i.id = va.incident_id
                                WHERE va.volunteer_id = ? AND i.disaster_type = 'FLOOD'");
    $floodStmt->execute([$vid]);
    if ($floodStmt->fetchColumn() >= 1) { 
        $badges[] = 'Aqua Guard';
    }

    // Badge: Night Owl (Assigned between 8PM and 6AM)
    // Note: assigned_at is DATETIME/TIMESTAMP
    $nightStmt = $pdo->prepare("SELECT COUNT(*) FROM volunteer_assignments 
                                WHERE volunteer_id = ? 
                                AND (HOUR(assigned_at) >= 20 OR HOUR(assigned_at) < 6)");
    $nightStmt->execute([$vid]);
    if ($nightStmt->fetchColumn() >= 1) {
        $badges[] = 'Night Owl';
    }

    // Badge: Medic (check skills for 'First Aid' or 'CPR')
    // Since we don't know exact skill names in DB, we'll join and check text
    $medicStmt = $pdo->prepare("SELECT COUNT(*) FROM volunteer_skills vs
                                JOIN skills s ON s.id = vs.skill_id
                                WHERE vs.volunteer_id = ? 
                                AND (s.name LIKE '%First Aid%' OR s.name LIKE '%Medic%' OR s.name LIKE '%CPR%')");
    $medicStmt->execute([$vid]);
    if ($medicStmt->fetchColumn() >= 1) {
        $badges[] = 'Medic';
    }

    $vol['gamification'] = [
        'rank' => $rank,
        'next_rank' => $nextRank,
        'xp' => $xp,
        'xp_needed' => $xpToNext,
        'missions' => $missions,
        'hours' => $hours,
        'badges' => $badges
    ];

    Response::ok(['volunteer' => $vol]);
  }

  public static function setAvailability(PDO $pdo, int $userId): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['availability']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $avail = strtoupper(trim((string)$data['availability']));
    if (!in_array($avail, ['AVAILABLE','BUSY'], true)) Response::badRequest('Invalid availability');

    $stmt = $pdo->prepare("UPDATE volunteers SET availability = ? WHERE user_id = ?");
    $stmt->execute([$avail, $userId]);

    if ($stmt->rowCount() === 0) Response::notFound('Volunteer profile not found');
    Response::ok(['message' => 'Availability updated']);
  }

  public static function list(PDO $pdo): void {
    $stmt = $pdo->query("SELECT v.*, u.user_name, u.email,
                                GROUP_CONCAT(s.name SEPARATOR ', ') as skills,
                                GROUP_CONCAT(s.id SEPARATOR ',') as skill_ids
                         FROM volunteers v
                         JOIN users u ON u.user_id = v.user_id
                         JOIN user_roles ur ON ur.user_id = u.user_id
                         JOIN roles r ON r.id = ur.role_id
                         LEFT JOIN volunteer_skills vs ON vs.volunteer_id = v.id
                         LEFT JOIN skills s ON s.id = vs.skill_id
                         WHERE r.role_name = 'VOLUNTEER'
                         GROUP BY v.id
                         ORDER BY v.availability ASC, v.id DESC");
    Response::ok(['volunteers' => $stmt->fetchAll()]);
  }

  public static function updateSkills(PDO $pdo, int $volunteerId): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $skills = $data['skills'] ?? [];
    
    if (!is_array($skills)) Response::badRequest('Skills must be an array of IDs');

    try {
      $pdo->beginTransaction();
      
      // Clear existing
      $stmt = $pdo->prepare("DELETE FROM volunteer_skills WHERE volunteer_id = ?");
      $stmt->execute([$volunteerId]);

      // Insert new
      if (!empty($skills)) {
        $stmt = $pdo->prepare("INSERT INTO volunteer_skills (volunteer_id, skill_id, skill_level) VALUES (?, ?, 'BASIC')");
        foreach ($skills as $skillId) {
            $stmt->execute([$volunteerId, (int)$skillId]);
        }
      }

      $pdo->commit();
      Response::ok(['message' => 'Skills updated']);
    } catch (Exception $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      Response::serverError('Failed to update skills');
    }
  }

  public static function addSkill(PDO $pdo, int $userId): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['skill_id']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $skillId = Validator::asInt($data['skill_id']);
    $level = isset($data['skill_level']) ? strtoupper(trim((string)$data['skill_level'])) : 'BASIC';
    if ($skillId === null) Response::badRequest('Invalid skill_id');
    if (!in_array($level, ['BASIC','INTERMEDIATE','ADVANCED'], true)) Response::badRequest('Invalid skill_level');

    $v = $pdo->prepare("SELECT id FROM volunteers WHERE user_id = ?");
    $v->execute([$userId]);
    $vol = $v->fetch();
    if (!$vol) Response::notFound('Volunteer profile not found');

    try {
      $stmt = $pdo->prepare("INSERT INTO volunteer_skills (volunteer_id, skill_id, skill_level)
                             VALUES (?, ?, ?)");
      $stmt->execute([(int)$vol['id'], $skillId, $level]);
      Response::created(['message' => 'Skill added']);
    } catch (PDOException $e) {
      Response::badRequest('Skill already exists for volunteer');
    }
  }

  public static function adminUpdateStatus(PDO $pdo, int $volunteerId): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $avail = isset($data['availability']) ? strtoupper(trim((string)$data['availability'])) : '';
    
    if (!in_array($avail, ['AVAILABLE','BUSY'], true)) Response::badRequest('Invalid availability');

    $stmt = $pdo->prepare("UPDATE volunteers SET availability = ? WHERE id = ?");
    $stmt->execute([$avail, $volunteerId]);

    if ($stmt->rowCount() === 0) Response::notFound('Volunteer not found');
    Response::ok(['message' => 'Volunteer status updated']);
  }

  public static function assign(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['volunteer_id','incident_id']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $vid = Validator::asInt($data['volunteer_id']);
    $iid = Validator::asInt($data['incident_id']);
    if ($vid === null || $iid === null) Response::badRequest('Invalid ids');

    // Check incident status
    $stmt = $pdo->prepare("SELECT status FROM incidents WHERE id = ?");
    $stmt->execute([$iid]);
    $status = $stmt->fetchColumn();

    if ($status === 'RESOLVED') {
        Response::badRequest('Cannot assign volunteers to a resolved incident.');
    }

    $stmt = $pdo->prepare("INSERT INTO volunteer_assignments (volunteer_id, incident_id) VALUES (?, ?)");
    $stmt->execute([$vid, $iid]);

    // set volunteer busy (optional)
    $pdo->prepare("UPDATE volunteers SET availability = 'BUSY' WHERE id = ?")->execute([$vid]);

    Response::created(['message' => 'Volunteer assigned', 'assignment_id' => (int)$pdo->lastInsertId()]);

    // NOTIFY Volunteer
    // Get user_id of the volunteer
    $uStmt = $pdo->prepare("SELECT user_id FROM volunteers WHERE id = ?");
    $uStmt->execute([$vid]);
    $userId = $uStmt->fetchColumn();

    if ($userId) {
        $incidentTitleStmt = $pdo->prepare("SELECT title FROM incidents WHERE id = ?");
        $incidentTitleStmt->execute([$iid]);
        $incTitle = $incidentTitleStmt->fetchColumn();

        NotificationManager::send($pdo, (int)$userId, 'New Assignment', "You have been assigned to incident: $incTitle. Please proceed to the location.", 'WARNING');
    }
  }

  public static function listAssignments(PDO $pdo): void {
    $stmt = $pdo->query("SELECT va.*, u.user_name, i.title AS incident_title
                         FROM volunteer_assignments va
                         JOIN volunteers v ON v.id = va.volunteer_id
                         JOIN users u ON u.user_id = v.user_id
                         JOIN incidents i ON i.id = va.incident_id
                         ORDER BY va.assigned_at DESC");
    Response::ok(['assignments' => $stmt->fetchAll()]);
  }
}

