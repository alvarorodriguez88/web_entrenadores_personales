-- -----------------------------------------------------
-- Migration v1.2.0
-- Description: Add asignacionEjercicio table to support
--              per-client exercise parameter customization
-- -----------------------------------------------------

USE `web_entrenadores`;

CREATE TABLE IF NOT EXISTS `web_entrenadores`.`asignacionEjercicio` (
  `id_asignacion_ejercicio`  INT NOT NULL AUTO_INCREMENT,
  `id_asignacion_rutina`     INT NOT NULL,
  `id_bloque_rutina_ej`      INT NOT NULL,
  `series_plan`              TINYINT NULL,
  `reps_plan`                TINYINT NULL,
  `peso_obj`                 DECIMAL(6,2) NULL,
  `descanso_seg`             SMALLINT NULL,
  `notas`                    VARCHAR(255) NULL,
  PRIMARY KEY (`id_asignacion_ejercicio`),
  UNIQUE INDEX `uq_asignacion_ejercicio` (`id_asignacion_rutina` ASC, `id_bloque_rutina_ej` ASC) VISIBLE,
  INDEX `fk_asignacion_ej_asignacion_idx` (`id_asignacion_rutina` ASC) VISIBLE,
  INDEX `fk_asignacion_ej_bloque_ej_idx` (`id_bloque_rutina_ej` ASC) VISIBLE,
  CONSTRAINT `fk_asignacion_ej_asignacion`
    FOREIGN KEY (`id_asignacion_rutina`)
    REFERENCES `web_entrenadores`.`asignacionRutina` (`id_asignacion_rutina`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_asignacion_ej_bloque_ej`
    FOREIGN KEY (`id_bloque_rutina_ej`)
    REFERENCES `web_entrenadores`.`bloqueRutinaEjercicio` (`id_bloque_rutina_ejercicio`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;