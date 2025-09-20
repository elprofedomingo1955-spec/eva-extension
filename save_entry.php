<?php
header('Content-Type: application/json');

// Config DB - ajusta esto
$dbhost = '127.0.0.1';
$dbname = 'bitacora_db';
$dbuser = 'elprofedomingo';
$dbpass = 'PEGA_QSSC_ALGMDP_CAC_1955';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if(!$data || !isset($data['content'])) {
  echo json_encode(['ok'=>false, 'error'=>'payload invalid']); exit;
}

$dest = $data['dest'] ?? '';
$author = $data['author'] ?? '';
$content = $data['content'];

try {
  $pdo = new PDO("mysql:host=$dbhost;dbname=$dbname;charset=utf8mb4", $dbuser, $dbpass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);
  $stmt = $pdo->prepare("INSERT INTO entries (dest, author, content, ts) VALUES (:dest, :author, :content, :ts)");
  $stmt->execute([
    ':dest'=>$dest,
    ':author'=>$author,
    ':content'=>$content,
    ':ts'=>time()
  ]);
  $id = $pdo->lastInsertId();
  echo json_encode(['ok'=>true, 'id'=>$id]);
} catch(PDOException $e) {
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()]);
}
?>