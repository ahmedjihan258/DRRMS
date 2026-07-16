<?php
declare(strict_types=1);

final class Response
{
  public static function json(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
  }

  public static function ok(array $data = []): void {
    self::json($data, 200);
  }

  public static function created(array $data = []): void {
    self::json($data, 201);
  }

  public static function badRequest(string $msg, array $details = []): void {
    self::json(['error' => $msg, 'details' => $details], 400);
  }

  public static function unauthorized(string $msg = 'Unauthorized'): void {
    self::json(['error' => $msg], 401);
  }

  public static function forbidden(string $msg = 'Forbidden'): void {
    self::json(['error' => $msg], 403);
  }

  public static function notFound(string $msg = 'Not Found'): void {
    self::json(['error' => $msg], 404);
  }

  public static function serverError(string $msg = 'Server Error'): void {
    self::json(['error' => $msg], 500);
  }
}
