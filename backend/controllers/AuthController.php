<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/JWT.php';

final class AuthController
{
  public static function register(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $missing = Validator::requireFields($data, ['user_name', 'email', 'password', 'role', 'phone_number']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $userName = trim((string)$data['user_name']);
    $email = strtolower(trim((string)$data['email']));
    $password = (string)$data['password'];
    $role = strtoupper(trim((string)$data['role']));
    $phone = trim((string)$data['phone_number']);

    // Create user
    try {
      $hash = password_hash($password, PASSWORD_BCRYPT);

      $stmt = $pdo->prepare("INSERT INTO users (user_name, email, password, phone_number, verification_code) VALUES (?, ?, ?, ?, ?)");
      $verificationCode = bin2hex(random_bytes(16));
      $stmt->execute([$userName, $email, $hash, $phone, $verificationCode]);
      $userId = (int)$pdo->lastInsertId();

      // attach role
      $r = $pdo->prepare("SELECT id FROM roles WHERE role_name = ?");
      $r->execute([$role]);
      $roleRow = $r->fetch();
      if (!$roleRow) Response::badRequest('Invalid role');

      $stmt2 = $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
      $stmt2->execute([$userId, (int)$roleRow['id']]);

      if ($role === 'VOLUNTEER') {
          // Create volunteer profile with provided location or default
          $lat = isset($data['latitude']) ? (float)$data['latitude'] : 0.0;
          $lng = isset($data['longitude']) ? (float)$data['longitude'] : 0.0;
          
          $v = $pdo->prepare("INSERT INTO volunteers (user_id, latitude, longitude, availability) VALUES (?, ?, ?, 'AVAILABLE')");
          $v->execute([$userId, $lat, $lng]);
          $volunteerId = (int)$pdo->lastInsertId();

          $skills = $data['skills'] ?? [];
          if (is_array($skills) && !empty($skills)) {
              $vs = $pdo->prepare("INSERT INTO volunteer_skills (volunteer_id, skill_id, skill_level) VALUES (?, ?, 'BASIC')");
              foreach ($skills as $sid) {
                  $vs->execute([$volunteerId, (int)$sid]);
              }
          }
      }

      // Send Verification Email
      require_once __DIR__ . '/../utils/NotificationManager.php';
      // $verifyLink = "http://localhost:5173/verify?email=" . urlencode($email) . "&code=" . $verificationCode;
      // Use code directly for now or link
      NotificationManager::sendEmail($email, "Verify Your DRRMS Account", 
        "Welcome to DRRMS! Please verify your account.<br><br>
         Your Verification Code: <b>$verificationCode</b><br><br>
         Or enter it in the app to proceed.");

      Response::created(['message' => 'User registered. Please check email for verification code.', 'user_id' => $userId]);
    } catch (PDOException $e) {
      Response::badRequest('Registration failed (maybe duplicate email?) ' . $e->getMessage());
    }
  }

  public static function verify(PDO $pdo): void {
      $data = json_decode(file_get_contents('php://input'), true) ?? [];
      $email = $data['email'] ?? '';
      $code = $data['code'] ?? '';

      $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ? AND verification_code = ?");
      $stmt->execute([$email, $code]);
      $user = $stmt->fetch();

      if (!$user) {
          Response::badRequest('Invalid email or verification code.');
      }

      $update = $pdo->prepare("UPDATE users SET is_verified = 1, verification_code = NULL WHERE user_id = ?");
      $update->execute([$user['user_id']]);

      Response::ok(['message' => 'Account verified successfully. You can now login.']);
  }

  public static function resendVerification(PDO $pdo): void {
      $data = json_decode(file_get_contents('php://input'), true) ?? [];
      $email = strtolower(trim((string)$data['email'] ?? ''));

      if (!$email) {
          Response::badRequest('Email is required.');
      }

      $stmt = $pdo->prepare("SELECT user_id, is_verified FROM users WHERE email = ?");
      $stmt->execute([$email]);
      $user = $stmt->fetch();

      if (!$user) {
          Response::badRequest('User not found.');
      }

      if (isset($user['is_verified']) && (int)$user['is_verified'] === 1) {
          Response::badRequest('Account already verified.');
      }

      // Generate new code
      $verificationCode = bin2hex(random_bytes(16));
      $update = $pdo->prepare("UPDATE users SET verification_code = ? WHERE user_id = ?");
      $update->execute([$verificationCode, $user['user_id']]);

      // Send Email
      require_once __DIR__ . '/../utils/NotificationManager.php';
      NotificationManager::sendEmail($email, "Verify Your DRRMS Account", 
        "Welcome to DRRMS! Please verify your account.<br><br>
         Your Verification Code: <b>$verificationCode</b><br><br>
         Or enter it in the app to proceed.");

      Response::ok(['message' => 'Verification code resent.']);
  }

  public static function login(PDO $pdo, array $settings): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $missing = Validator::requireFields($data, ['email', 'password']);
    if ($missing) Response::badRequest('Missing fields', $missing);

    $email = strtolower(trim((string)$data['email']));
    $password = (string)$data['password'];

    $stmt = $pdo->prepare("SELECT user_id, user_name, email, password, phone_number, is_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
      Response::unauthorized('Invalid email or password');
    }

    if (isset($user['is_verified']) && (int)$user['is_verified'] === 0) {
        Response::unauthorized('Please verify your email address before logging in.');
    }


    // roles
    $r = $pdo->prepare("SELECT r.role_name
                        FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                        WHERE ur.user_id = ?");
    $r->execute([(int)$user['user_id']]);
    $roles = array_map(fn($row) => $row['role_name'], $r->fetchAll());

    $now = time();
    $payload = [
      'sub' => (int)$user['user_id'],
      'name' => $user['user_name'],
      'roles' => $roles,
      'iat' => $now,
      'exp' => $now + (int)$settings['jwt_expiry_seconds'],
    ];

    $token = JWT::encode($payload, $settings['jwt_secret']);

    Response::ok([
      'token' => $token,
      'user' => [
        'user_id' => (int)$user['user_id'],
        'user_name' => $user['user_name'],
        'email' => $user['email'],
        'phone_number' => $user['phone_number'],
        'roles' => $roles,
      ]
    ]);
  }

  public static function me(PDO $pdo, array $jwtPayload): void {
    $userId = (int)$jwtPayload['sub'];

    $stmt = $pdo->prepare("SELECT user_id, user_name, email, phone_number, created_at FROM users WHERE user_id = ?");
    $stmt->execute([$userId]);
    $u = $stmt->fetch();
    if (!$u) Response::notFound('User not found');

    // roles
    $r = $pdo->prepare("SELECT r.role_name
                        FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                        WHERE ur.user_id = ?");
    $r->execute([$userId]);
    $roles = array_map(fn($row) => $row['role_name'], $r->fetchAll());

    Response::ok(['user' => $u, 'roles' => $roles]);
  }
}

