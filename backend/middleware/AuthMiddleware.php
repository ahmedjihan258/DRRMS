<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWT.php';

final class AuthMiddleware
{
  public static function requireAuth(array $settings): array {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$auth || stripos($auth, 'Bearer ') !== 0) {
      Response::unauthorized('Missing Bearer token');
    }

    $token = trim(substr($auth, 7));
    try {
      return JWT::decodeAndVerify($token, $settings['jwt_secret']);
    } catch (Exception $e) {
      Response::unauthorized($e->getMessage());
    }
    return [];
  }
}
