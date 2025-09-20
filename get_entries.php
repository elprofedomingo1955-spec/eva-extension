<?php
header('Content-Type: application/json');

// Config DB - ajusta esto
$dbhost = '127.0.0.1';
$dbname = 'bitacora_db';
$dbuser = 'elprofedomingo';
$dbpass = 'PEGA_QSSC_ALGMDP_CAC_1955';

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

try {
  $pdo = new PDO("mysql:host=$dbhost;dbname=$dbname;charset=utf8mb4", $dbuser, $dbpass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);
  $stmt = $pdo->prepare("SELECT id, dest, author, content, ts FROM entries ORDER BY ts DESC LIMIT :limit");
  $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
  $stmt->execute();
  $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(['ok'=>true, 'entries'=>$entries]);
} catch(PDOException $e) {
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()]);
}
?>