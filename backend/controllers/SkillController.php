<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';

final class SkillController
{
  public static function list(PDO $pdo): void {
    try {
      $stmt = $pdo->query("SELECT id, name FROM skills ORDER BY name ASC");
      $skills = $stmt->fetchAll(PDO::FETCH_ASSOC);
      Response::ok(['skills' => $skills]);
    } catch (PDOException $e) {
      // In case table handling is weird or missing
      Response::ok(['skills' => []]);
    }
  }
}
