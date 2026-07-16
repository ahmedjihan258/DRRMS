<?php
declare(strict_types=1);

final class Validator
{
  public static function requireFields(array $data, array $fields): array {
    $missing = [];
    foreach ($fields as $f) {
      if (!array_key_exists($f, $data) || $data[$f] === null || $data[$f] === '') {
        $missing[] = $f;
      }
    }
    return $missing;
  }

  public static function inEnum(string $value, array $allowed): bool {
    return in_array($value, $allowed, true);
  }

  public static function asFloat($value): ?float {
    if ($value === null) return null;
    if (is_numeric($value)) return (float)$value;
    return null;
  }

  public static function asInt($value): ?int {
    if ($value === null) return null;
    if (is_numeric($value)) return (int)$value;
    return null;
  }
}
