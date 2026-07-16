<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

final class UserController
{
  public static function list(PDO $pdo): void {
    $stmt = $pdo->query("
      SELECT u.user_id, u.user_name, u.email, u.created_at,
             GROUP_CONCAT(r.role_name SEPARATOR ',') as roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.user_id
      LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
    ");
    
    $users = $stmt->fetchAll();
    
    // Transform roles string to array
    foreach ($users as &$user) {
        $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : [];
    }

    Response::ok(['users' => $users]);
  }

  public static function updateRole(PDO $pdo, int $userId): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['role']);
    if ($missing) Response::badRequest('Missing role', $missing);

    $roleName = strtoupper(trim((string)$data['role']));
    
    // Validate role exists
    $r = $pdo->prepare("SELECT id FROM roles WHERE role_name = ?");
    $r->execute([$roleName]);
    $roleRow = $r->fetch();
    
    if (!$roleRow) Response::badRequest('Invalid role');

    try {
      $pdo->beginTransaction();

      // Clear existing roles (assuming single role system for simplicity, or we can just update)
      // The requirement says "change their roles", implying replacement or addition.
      // Usually in this simple system, user has one primary role or multiple.
      // Let's assume we REPLACE the role(s) with the new one for simplicity, 
      // or we can just replace. 
      // Given the `register` logic, it inserts into `user_roles`.
      
      $del = $pdo->prepare("DELETE FROM user_roles WHERE user_id = ?");
      $del->execute([$userId]);

      $ins = $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
      $ins->execute([$userId, (int)$roleRow['id']]);

      $pdo->commit();
      Response::ok(['message' => 'Role updated']);
    } catch (Exception $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      Response::serverError('Failed to update role');
    }
  }
}
