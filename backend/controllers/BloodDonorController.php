<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

final class BloodDonorController
{
  public static function list(PDO $pdo): void {
    // Show eligible donors who are active
    // We compute eligibility on the fly or database side? 
    // Requirement: Show limited info publicly (name + blood group + availability).
    // Availability is basically NOW() > eligibleFrom.
    
    // We will select donors where status = 'ACTIVE'
    // Join with Users to get name.
    
    $sql = "
      SELECT bd.id, u.user_name, u.email, u.phone_number, bd.blood_group, bd.last_donation_date, bd.status,
             CASE 
               WHEN bd.last_donation_date IS NULL THEN 'ELIGIBLE'
               WHEN DATEDIFF(NOW(), bd.last_donation_date) >= 90 THEN 'ELIGIBLE'
               ELSE 'NOT_ELIGIBLE'
             END as eligibility_status,
             DATE_ADD(bd.last_donation_date, INTERVAL 90 DAY) as next_eligible_date
      FROM blood_donors bd
      JOIN users u ON u.user_id = bd.user_id
      WHERE bd.status = 'ACTIVE'
      ORDER BY bd.created_at DESC
    ";

    $stmt = $pdo->query($sql);
    $donors = $stmt->fetchAll();

    Response::ok(['donors' => $donors]);
  }

  public static function me(PDO $pdo, int $userId): void {
      $stmt = $pdo->prepare("SELECT * FROM blood_donors WHERE user_id = ?");
      $stmt->execute([$userId]);
      $donor = $stmt->fetch();
      
      if (!$donor) {
          Response::ok(['is_donor' => false]);
      } else {
          Response::ok(['is_donor' => true, 'donor' => $donor]);
      }
  }

  public static function register(PDO $pdo, int $userId): void {
      $data = json_decode(file_get_contents('php://input'), true) ?? [];
      $missing = Validator::requireFields($data, ['blood_group']);
      if ($missing) Response::badRequest('Missing blood group', $missing);

      $bg = strtoupper(trim($data['blood_group']));
      $validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!in_array($bg, $validGroups, true)) Response::badRequest('Invalid blood group');

      $lastDate = !empty($data['last_donation_date']) ? $data['last_donation_date'] : null;
      $status = 'ACTIVE'; // Default active when registering

      // Upsert logic (if user was previously donor but deleted/inactive?)
      // Actually requirement says "become a donor". 
      // Let's check if exists first.
      $check = $pdo->prepare("SELECT id FROM blood_donors WHERE user_id = ?");
      $check->execute([$userId]);
      if ($check->fetch()) {
          Response::badRequest('You are already registered as a donor.');
      }

      try {
          $stmt = $pdo->prepare("INSERT INTO blood_donors (user_id, blood_group, last_donation_date, status) VALUES (?, ?, ?, ?)");
          $stmt->execute([$userId, $bg, $lastDate, $status]);
          Response::created(['message' => 'Registered as blood donor']);
      } catch (Exception $e) {
          Response::serverError("Failed to register");
      }
  }

  public static function update(PDO $pdo, int $userId): void {
      // Allow updating last donation date or status
      $data = json_decode(file_get_contents('php://input'), true) ?? [];
      
      $updates = [];
      $params = [];

      if (array_key_exists('status', $data)) {
          $st = strtoupper($data['status']);
          if (in_array($st, ['ACTIVE', 'INACTIVE'])) {
              $updates[] = "status = ?";
              $params[] = $st;
          }
      }

      if (array_key_exists('last_donation_date', $data)) {
          $updates[] = "last_donation_date = ?";
          $params[] = $data['last_donation_date'] ?: null;
      }
      
      if (empty($updates)) Response::badRequest('No fields to update');

      $params[] = $userId;
      
      try {
        $sql = "UPDATE blood_donors SET " . implode(', ', $updates) . " WHERE user_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        Response::ok(['message' => 'Donor profile updated']);
      } catch (Exception $e) {
        Response::serverError("Failed to update");
      }
  }
}
