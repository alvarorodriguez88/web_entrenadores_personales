-- -----------------------------------------------------
-- Migration v1.1.0
-- Description: Add archivado field to rutina and ejercicio,
--              fix NOT NULL constraints in sesionRutina
-- -----------------------------------------------------

USE `web_entrenadores`;

ALTER TABLE `web_entrenadores`.`rutina`
  ADD COLUMN `archivado` TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE `web_entrenadores`.`ejercicio`
  ADD COLUMN `archivado` TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE `web_entrenadores`.`sesionRutina`
  MODIFY COLUMN `id_asignacion` INT NOT NULL,
  MODIFY COLUMN `id_bloque_rutina` INT NOT NULL;