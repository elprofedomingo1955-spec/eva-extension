-- Crear base de datos y usuario
CREATE DATABASE bitacora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'elprofedomingo'@'localhost' IDENTIFIED BY 'PEGA_QSSC_ALGMDP_CAC_1955';
GRANT ALL PRIVILEGES ON bitacora_db.* TO 'elprofedomingo'@'localhost';
FLUSH PRIVILEGES;
GRANT USAGE ON BIT
-- Usar la base de datos
USE bitacora_db;

-- Crear tabla de entradas
CREATE TABLE entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dest VARCHAR(200),
  author VARCHAR(200),
  content MEDIUMTEXT,
  ts INT UNSIGNED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;º