<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/NotificationManager.php';

final class NotificationController
{
  public static function create(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $missing = Validator::requireFields($data, ['title', 'message', 'target_type']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $title = trim((string)$data['title']);
    $message = (string)$data['message'];
    $type = isset($data['type']) ? strtoupper($data['type']) : 'INFO'; // 'INFO', 'ALERT'
    $targetType = strtoupper($data['target_type']); // 'GLOBAL', 'ROLE', 'USER'

    try {
      if ($targetType === 'GLOBAL') {
        NotificationManager::sendGlobal($pdo, $title, $message, $type);
      } 
      elseif ($targetType === 'ROLE') {
        if (empty($data['role_name'])) Response::badRequest('Missing role_name');
        NotificationManager::sendToRole($pdo, $data['role_name'], $title, $message, $type);
      } 
      elseif ($targetType === 'USER') {
        if (empty($data['user_id'])) Response::badRequest('Missing user_id');
        NotificationManager::sendToUser($pdo, (int)$data['user_id'], $title, $message, $type);
      } 
      else {
        Response::badRequest('Invalid target_type. Must be GLOBAL, ROLE, or USER');
      }

      Response::created(['message' => 'Notification created']);
    } catch (Exception $e) {
      Response::serverError('Failed to create notification: ' . $e->getMessage());
    }
  }

  public static function list(PDO $pdo, int $userId): void {
    // Return unread first, then read, ordered by date desc
    $stmt = $pdo->prepare("
        SELECT n.id, n.title, n.message, n.type, n.created_at, nr.is_read, nr.read_at
        FROM notifications n
        JOIN notification_recipients nr ON nr.notification_id = n.id
        WHERE nr.user_id = ?
        ORDER BY nr.is_read ASC, n.created_at DESC
        LIMIT 100
    ");
    $stmt->execute([$userId]);
    Response::ok(['notifications' => $stmt->fetchAll()]);
  }

  public static function markAsRead(PDO $pdo, int $userId, int $notificationId): void {
    $stmt = $pdo->prepare("UPDATE notification_recipients SET is_read = 1, read_at = NOW() WHERE notification_id = ? AND user_id = ?");
    $stmt->execute([$notificationId, $userId]);
    
    if ($stmt->rowCount() === 0) {
        // Could be already read or doesn't belong to user, but let's just say OK to be idempotent
        // Or check if it exists:
        // Response::notFound('Notification not found');
    }
    Response::ok(['message' => 'Marked as read']);
  }
}
