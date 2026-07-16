<?php
declare(strict_types=1);


if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
    
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $_SERVER['HTTP_AUTHORIZATION'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['Authorization'])) {
        $_SERVER['HTTP_AUTHORIZATION'] = $_SERVER['Authorization'];
    } elseif (function_exists('apache_request_headers')) {
        
        $headers = apache_request_headers();

      
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $_SERVER['HTTP_AUTHORIZATION'] = $value;
                break;
            }
        }
    }
}


header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../routes/api.php';