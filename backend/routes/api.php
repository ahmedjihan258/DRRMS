<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
$settings = require __DIR__ . '/../config/settings.php';

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/RoleMiddleware.php';




require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/IncidentController.php';
require_once __DIR__ . '/../controllers/ResourceController.php';
require_once __DIR__ . '/../controllers/ShelterController.php';
require_once __DIR__ . '/../controllers/VolunteerController.php';
require_once __DIR__ . '/../controllers/NotificationController.php';
require_once __DIR__ . '/../controllers/SkillController.php';
require_once __DIR__ . '/../controllers/WarehouseController.php';
require_once __DIR__ . '/../controllers/BloodDonorController.php';



$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '';


$apiPos = strpos($uri, '/api/');
if ($apiPos === false) {
  Response::notFound('Invalid API path');
}
$path = substr($uri, $apiPos);
$m=[]; 


function route(string $methodNeed, string $pathNeed, string $method, string $path): bool {
  return $method === $methodNeed && $path === $pathNeed;
}
function matchId(string $pattern, string $path, array &$matches): bool {
  return (bool)preg_match($pattern, $path, $matches);
}




if (route('POST', '/api/register', $method, $path)) {
  AuthController::register($pdo);
}
if (route('POST', '/api/login', $method, $path)) {
  AuthController::login($pdo, $settings);
}
if (route('POST', '/api/verify', $method, $path)) {
  AuthController::verify($pdo);
}
if (route('POST', '/api/resend-verification', $method, $path)) {
  AuthController::resendVerification($pdo);
}




$jwtPayload = AuthMiddleware::requireAuth($settings);
$userId = (int)($jwtPayload['sub'] ?? 0);
if ($userId <= 0) Response::unauthorized('Invalid token subject');

if (route('GET', '/api/me', $method, $path)) {
  AuthController::me($pdo, $jwtPayload);
}

// User Management (Admin Only)
if (route('GET', '/api/users', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
  UserController::list($pdo);
}
if (matchId('#^/api/users/(\d+)/role$#', $path, $m) && $method === 'PUT') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
  UserController::updateRole($pdo, (int)$m[1]);
}
if (route('PUT', '/api/users/me', $method, $path)) {
  UserController::updateProfile($pdo, $userId);
}




if (route('GET', '/api/incidents', $method, $path)) {
  IncidentController::list($pdo);
}
if (route('POST', '/api/incidents', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','AUTHORITY','DISPATCHER','VOLUNTEER','CITIZEN']);
  IncidentController::create($pdo, $userId);
}
if (matchId('#^/api/incidents/(\d+)$#', $path, $m) && $method === 'GET') {
  IncidentController::get($pdo, (int)$m[1]);
}
if (matchId('#^/api/incidents/(\d+)/status$#', $path, $m) && $method === 'PUT') {
  
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','AUTHORITY','DISPATCHER']);
  IncidentController::updateStatus($pdo, (int)$m[1]);
}
if (matchId('#^/api/incidents/(\d+)/updates$#', $path, $m) && $method === 'POST') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','AUTHORITY','DISPATCHER','VOLUNTEER']);
  IncidentController::addUpdate($pdo, $userId, (int)$m[1]);
}





if (route('GET', '/api/resources', $method, $path)) {
  ResourceController::listResources($pdo);
}
if (route('POST', '/api/resources', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
  ResourceController::createResource($pdo);
}
if (route('GET', '/api/stocks', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','AUTHORITY','DISPATCHER','VOLUNTEER']);
  ResourceController::listStocks($pdo);
}
if (route('POST', '/api/stocks', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
  ResourceController::addStock($pdo);
}
if (matchId('#^/api/stocks/(\d+)$#', $path, $m) && $method === 'PUT') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
  ResourceController::updateStock($pdo, (int)$m[1]);
}
if (route('GET', '/api/deployments', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','AUTHORITY','DISPATCHER']);
  ResourceController::listDeployments($pdo);
}
if (route('POST', '/api/deployments', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','DISPATCHER']);
  ResourceController::deploy($pdo);
}





if (route('GET', '/api/shelters', $method, $path)) {
  ShelterController::list($pdo);
}
if (route('POST', '/api/shelters', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
  ShelterController::create($pdo);
}
if (route('POST', '/api/shelters/occupancy', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','DISPATCHER','VOLUNTEER']);
  ShelterController::logOccupancy($pdo);
}
if (route('POST', '/api/shelters/adjust_occupancy', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','AUTHORITY','DISPATCHER','VOLUNTEER']);
  ShelterController::adjustOccupancy($pdo);
}
if (matchId('#^/api/shelters/(\d+)/logs$#', $path, $m) && $method === 'GET') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','DISPATCHER','AUTHORITY']);
  ShelterController::logs($pdo, (int)$m[1]);
}
if (matchId('#^/api/shelters/(\d+)/residents$#', $path, $m) && $method === 'GET') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','DISPATCHER','AUTHORITY']);
  ShelterController::getResidents($pdo, (int)$m[1]);
}
if (matchId('#^/api/shelters/(\d+)$#', $path, $m) && $method === 'GET') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','DISPATCHER','AUTHORITY','VOLUNTEER','CITIZEN']);
  ShelterController::get($pdo, (int)$m[1]);
}
if (matchId('#^/api/shelters/(\d+)$#', $path, $m) && $method === 'PUT') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','DISPATCHER']); 
  ShelterController::update($pdo, (int)$m[1]);
}
if (matchId('#^/api/shelters/(\d+)$#', $path, $m) && $method === 'DELETE') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
  ShelterController::delete($pdo, (int)$m[1]);
}




if (route('GET', '/api/volunteers', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','DISPATCHER','AUTHORITY']);
  VolunteerController::list($pdo);
}
if (route('GET', '/api/volunteers/me', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['VOLUNTEER']);
  VolunteerController::getMe($pdo, $userId);
}
if (route('POST', '/api/volunteers/profile', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['VOLUNTEER','ADMIN']);
  VolunteerController::createProfile($pdo, $userId);
}
if (route('PUT', '/api/volunteers/availability', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['VOLUNTEER','ADMIN']);
  VolunteerController::setAvailability($pdo, $userId);
}
if (matchId('#^/api/volunteers/(\d+)/availability$#', $path, $m) && $method === 'PUT') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
  VolunteerController::adminUpdateStatus($pdo, (int)$m[1]);
}
if (matchId('#^/api/volunteers/(\d+)/skills$#', $path, $m) && $method === 'PUT') {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
  VolunteerController::updateSkills($pdo, (int)$m[1]);
}
if (route('GET', '/api/skills', $method, $path)) {
  SkillController::list($pdo);
}
if (route('POST', '/api/volunteers/skills', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['VOLUNTEER','ADMIN']);
  VolunteerController::addSkill($pdo, $userId);
}
if (route('POST', '/api/assignments', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','DISPATCHER']);
  VolunteerController::assign($pdo);
}
if (route('GET', '/api/assignments', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','DISPATCHER','AUTHORITY']);
  VolunteerController::listAssignments($pdo);
}




if (route('GET', '/api/notifications', $method, $path)) {
  NotificationController::list($pdo, $userId);
}
if (matchId('#^/api/notifications/(\d+)/read$#', $path, $m) && ($method === 'PUT' || $method === 'POST')) {
  NotificationController::markAsRead($pdo, $userId, (int)$m[1]);
}
if (route('POST', '/api/notifications', $method, $path)) {
  RoleMiddleware::requireRole($pdo, $userId, ['ADMIN','AUTHORITY']);
  NotificationController::create($pdo);
}

if (route('GET', '/api/warehouses', $method, $path)) {
  WarehouseController::list($pdo);
}
if (route('POST', '/api/warehouses', $method, $path)) {
    RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
    WarehouseController::create($pdo);
}
if (matchId('#^/api/warehouses/(\d+)$#', $path, $m) && $method === 'PUT') {
    RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
    WarehouseController::update($pdo, (int)$m[1]);
}
if (matchId('#^/api/warehouses/(\d+)$#', $path, $m) && $method === 'DELETE') {
    RoleMiddleware::requireRole($pdo, $userId, ['ADMIN']);
    WarehouseController::delete($pdo, (int)$m[1]);
}


// Blood Donors
if (route('GET', '/api/donors', $method, $path)) {
    BloodDonorController::list($pdo);
}
if (route('GET', '/api/donors/me', $method, $path)) {
    BloodDonorController::me($pdo, $userId);
}
if (route('POST', '/api/donors', $method, $path)) {
    // Anyone can become donor? Yes as per requirement.
    BloodDonorController::register($pdo, $userId);
}
if (route('PUT', '/api/donors/me', $method, $path)) {
    BloodDonorController::update($pdo, $userId);
}


Response::notFound('Route not found');
