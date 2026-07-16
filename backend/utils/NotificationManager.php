<?php
declare(strict_types=1);

class NotificationManager
{
    public static function sendGlobal(PDO $pdo, string $title, string $message, string $type = 'INFO'): void
    {
        $notifId = self::createNotification($pdo, $title, $message, $type);
        // Link all users
        $stmt = $pdo->query("SELECT user_id FROM users");
        $users = $stmt->fetchAll(PDO::FETCH_COLUMN);
        self::linkRecipients($pdo, $notifId, $users);
    }

    public static function sendToRole(PDO $pdo, string $roleName, string $title, string $message, string $type = 'INFO'): void
    {
        $notifId = self::createNotification($pdo, $title, $message, $type);
        // Find users with role
        $stmt = $pdo->prepare("
            SELECT u.user_id 
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.user_id
            JOIN roles r ON r.id = ur.role_id
            WHERE r.role_name = ?
        ");
        $stmt->execute([$roleName]);
        $users = $stmt->fetchAll(PDO::FETCH_COLUMN);
        self::linkRecipients($pdo, $notifId, $users);
    }

    public static function sendToUser(PDO $pdo, int $userId, string $title, string $message, string $type = 'INFO'): void
    {
        $notifId = self::createNotification($pdo, $title, $message, $type);
        self::linkRecipients($pdo, $notifId, [$userId]);
    }

    private static function createNotification(PDO $pdo, string $title, string $message, string $type): int
    {
        $stmt = $pdo->prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)");
        $stmt->execute([$title, $message, $type]);
        return (int)$pdo->lastInsertId();
    }

    private static function linkRecipients(PDO $pdo, int $notifId, array $userIds): void
    {
        if (empty($userIds)) return;
        
        // Batch insert for performance
        $values = [];
        $placeholders = [];
        foreach ($userIds as $uid) {
            $placeholders[] = "(?, ?)";
            $values[] = $notifId;
            $values[] = $uid;
        }
        
        $sql = "INSERT INTO notification_recipients (notification_id, user_id) VALUES " . implode(',', $placeholders);
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        // TODO: Send Emails here if applicable
        // self::sendEmails($userIds, $title, $message);
    }
}
