-- -----------------------------------------------------
-- Migration v1.5.0 — add chat tables
-- Project : web_entrenadores
-- Date    : 2026-05-10
-- Adds    : chat_sesion, chat_mensaje
-- -----------------------------------------------------

USE `web_entrenadores`;


CREATE TABLE IF NOT EXISTS `web_entrenadores`.`chat_sesion` (
  `id_chat_sesion` INT NOT NULL AUTO_INCREMENT,
  `id_entrenador` INT NOT NULL,
  `titulo` VARCHAR(150) NULL COMMENT 'Título opcional, ej: "Consulta sobre Carlos"',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_updated`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_chat_sesion`),
  INDEX `fk_chat_sesion_entrenador_idx` (`id_entrenador` ASC) VISIBLE,
  CONSTRAINT `fk_chat_sesion_entrenador`
    FOREIGN KEY (`id_entrenador`)
    REFERENCES `web_entrenadores`.`entrenador` (`id_usuario`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `web_entrenadores`.`chat_mensaje` (
  `id_chat_mensaje` INT NOT NULL AUTO_INCREMENT,
  `id_sesion` INT NOT NULL,
  `rol` ENUM(
            'user',
            'assistant',
            'tool'
        ) NOT NULL COMMENT 'Convenio OpenAI/Ollama',
  `content` TEXT NOT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_chat_mensaje`),
  INDEX `idx_chat_mensaje_sesion_fecha` (`id_sesion` ASC, `fecha_creacion` ASC) VISIBLE,
  CONSTRAINT `fk_chat_mensaje_sesion`
    FOREIGN KEY (`id_sesion`)
    REFERENCES `web_entrenadores`.`chat_sesion` (`id_chat_sesion`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB;