-- -----------------------------------------------------
-- Migration v1.3.0
-- Description: Add nota_rendimiento and conformidad to sesionRutina,
--              make fecha_fin NOT NULL in asignacionRutina,
--              add objetivo to cliente,
--              add categoria_ejercicio and ejercicio_categoria tables
-- -----------------------------------------------------

USE web_entrenadores;

ALTER TABLE `web_entrenadores`.`sesionRutina`
    ADD COLUMN `nota_rendimiento` DECIMAL(4,2) NULL,
    ADD COLUMN `conformidad` TINYINT NULL;

ALTER TABLE `web_entrenadores`.`asignacionRutina`
    MODIFY COLUMN `fecha_fin` DATE NOT NULL;

ALTER TABLE `web_entrenadores`.`cliente`
    ADD COLUMN `objetivo` ENUM(
        'PERDER_PESO',
        'GANAR_MASA',
        'MEJORAR_RESISTENCIA',
        'MEJORAR_FUERZA',
        'MANTENIMIENTO'
    ) NULL;

CREATE TABLE IF NOT EXISTS `web_entrenadores`.`categoria` (
    `id_categoria` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id_categoria`),
    UNIQUE INDEX `uq_categoria_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `web_entrenadores`.`categoria` (`nombre`) VALUES
    ('FUERZA'),
    ('CARDIO'),
    ('MOVILIDAD'),
    ('HIIT'),
    ('FUNCIONAL'),
    ('CORE');

CREATE TABLE IF NOT EXISTS `web_entrenadores`.`ejercicioCategoria` (
    `id_ejercicio` INT NOT NULL,
	`id_categoria` INT NOT NULL,
    PRIMARY KEY (`id_ejercicio`, `id_categoria`),
    CONSTRAINT `fk_ejercicio`
        FOREIGN KEY (`id_ejercicio`)
        REFERENCES `web_entrenadores`.`ejercicio` (`id_ejercicio`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_categoria`
        FOREIGN KEY (`id_categoria`)
        REFERENCES `web_entrenadores`.`categoria` (`id_categoria`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;