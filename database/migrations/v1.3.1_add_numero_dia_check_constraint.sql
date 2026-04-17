-- -----------------------------------------------------
-- Migration v1.3.1
-- Description: Add CHECK constraint to bloqueRutina.numero_dia
--              to enforce day-of-week meaning (1=Monday to 7=Sunday)
-- -----------------------------------------------------

USE `web_entrenadores`;

ALTER TABLE `web_entrenadores`.`bloqueRutina`
    ADD CONSTRAINT `chk_numero_dia` CHECK (`numero_dia` BETWEEN 1 AND 7);