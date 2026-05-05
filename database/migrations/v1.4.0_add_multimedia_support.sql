-- -----------------------------------------------------
-- Migration v1.4.0
-- Description: Add archivoMultimedia table and update ejercicio
--              to reference media files via FK instead of free-text URLs.
--              video_url and fotos_url columns are dropped (data not migrated,
--              as the new system requires files uploaded to the media volume).
-- -----------------------------------------------------

USE `web_entrenadores`;


CREATE TABLE IF NOT EXISTS `web_entrenadores`.`archivoMultimedia` (
    `id_archivo`       INT NOT NULL AUTO_INCREMENT,
    `id_entrenador`    INT NOT NULL,
    `nombre_original`  VARCHAR(255) NOT NULL,
    `nombre_archivo`   VARCHAR(255) NOT NULL,
    `tipo`             ENUM('VIDEO', 'IMAGEN') NOT NULL,
    `tamano_bytes`     INT NOT NULL,
    `fecha_subida`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_archivo`),
    UNIQUE INDEX `uq_nombre_archivo` (`nombre_archivo`),
    INDEX `fk_multimedia_entrenador_idx` (`id_entrenador`),
    CONSTRAINT `fk_multimedia_entrenador`
        FOREIGN KEY (`id_entrenador`)
        REFERENCES `web_entrenadores`.`entrenador` (`id_usuario`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE `web_entrenadores`.`ejercicio`
    DROP COLUMN `video_url`,
    DROP COLUMN `fotos_url`;


ALTER TABLE `web_entrenadores`.`ejercicio`
    ADD COLUMN `id_video`  INT NULL,
    ADD COLUMN `id_imagen` INT NULL,
    ADD CONSTRAINT `fk_ejercicio_video`
        FOREIGN KEY (`id_video`)
        REFERENCES `web_entrenadores`.`archivoMultimedia` (`id_archivo`)
        ON DELETE SET NULL
        ON UPDATE NO ACTION,
    ADD CONSTRAINT `fk_ejercicio_imagen`
        FOREIGN KEY (`id_imagen`)
        REFERENCES `web_entrenadores`.`archivoMultimedia` (`id_archivo`)
        ON DELETE SET NULL
        ON UPDATE NO ACTION;