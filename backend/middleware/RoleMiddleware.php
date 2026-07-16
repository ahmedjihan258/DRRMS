<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';

final class RoleMiddleware
{
  public static function requireRole(PDO $pdo, int $userId, array $allowedRoles): void {
    // Fetch roles for user
    $sql = "SELECT r.role_name
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $roles = array_map(fn($row) => $row['role_name'], $stmt->fetchAll());

    foreach ($roles as $r) {
      if (in_array($r, $allowedRoles, true)) return;
    }
    Response::forbidden('Insufficient role');
  }
}
