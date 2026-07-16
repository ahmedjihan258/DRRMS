<?php
declare(strict_types=1);

final class JWT
{
  private static function base64urlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
  }

  private static function base64urlDecode(string $data): string {
    $remainder = strlen($data) % 4;
    if ($remainder) {
      $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/')) ?: '';
  }

  public static function encode(array $payload, string $secret): string {
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];

    $h = self::base64urlEncode(json_encode($header));
    $p = self::base64urlEncode(json_encode($payload));

    $sig = hash_hmac('sha256', "$h.$p", $secret, true);
    $s = self::base64urlEncode($sig);

    return "$h.$p.$s";
  }

  public static function decodeAndVerify(string $token, string $secret): array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
      throw new Exception('Invalid token format');
    }

    [$h, $p, $s] = $parts;

    $calc = self::base64urlEncode(hash_hmac('sha256', "$h.$p", $secret, true));
    if (!hash_equals($calc, $s)) {
      throw new Exception('Invalid signature');
    }

    $payloadJson = self::base64urlDecode($p);
    $payload = json_decode($payloadJson, true);
    if (!is_array($payload)) {
      throw new Exception('Invalid payload');
    }

    // exp check
    if (isset($payload['exp']) && is_numeric($payload['exp'])) {
      if (time() >= (int)$payload['exp']) {
        throw new Exception('Token expired');
      }
    }

    return $payload;
  }
}
