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

    private static function keyBy($array, $key) {
        $result = [];
        foreach ($array as $element) {
            $result[$element[$key]] = $element;
        }
        return $result;
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

        // Fetch emails for these users to send email notifications
        $inQuery = implode(',', array_fill(0, count($userIds), '?'));
        $ustmt = $pdo->prepare("SELECT user_id, email, user_name FROM users WHERE user_id IN ($inQuery)");
        $ustmt->execute($userIds);
        $users = $ustmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch notification details
        $nstmt = $pdo->prepare("SELECT title, message, type FROM notifications WHERE id = ?");
        $nstmt->execute([$notifId]);
        $notif = $nstmt->fetch(PDO::FETCH_ASSOC);

        if ($notif) {
            foreach ($users as $user) {
                // Determine importance
                $priority = $notif['type'] === 'ALERT' || $notif['type'] === 'WARNING';
                
                // Only send emails for important alerts or if specifically requested (can be expanded)
                if ($priority) {
                    self::sendEmail($user['email'], $notif['title'], $notif['message']);
                }
            }
        }
    }

    public static function sendEmail(string $to, string $subject, string $message): void
    {
        // Headers for HTML email
        $headers  = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: DRRMS Alert System <no-reply@drrms.local>" . "\r\n";

        // HTML Template
        $body = "
        <html>
        <head>
          <title>$subject</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background-color: #ef4444; color: white; padding: 10px; border-radius: 4px; text-align: center; }
            .content { margin-top: 20px; font-size: 16px; line-height: 1.6; color: #333; }
            .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
          </style>
        </head>
        <body>
          <div class='container'>
            <div class='header'>
              <h2>DRRMS Notification</h2>
            </div>
            <div class='content'>
              <h3>$subject</h3>
              <p>$message</p>
            </div>
            <div class='footer'>
              <p>This is an automated message from the Disaster Risk & Resource Management System.</p>
            </div>
          </div>
        </body>
        </html>
        ";

        // Attempt to send
        // Note: This relies on XAMPP/PHP mail settings (sendmail)
        @mail($to, $subject, $body, $headers);
    }
}
