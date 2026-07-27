# Plataforma web para la gestión y análisis personalizado de entrenamientos deportivos

Plataforma web full-stack para la gestión y análisis personalizado de entrenamientos deportivos, con un asistente conversacional de inteligencia artificial integrado.

**Trabajo de Fin de Grado** — Ciencia e Ingeniería de Datos, Universidad de Las Palmas de Gran Canaria (ULPGC).

**Nota final**: 9.9 y propuesta para matrícula de honor.

---

## Índice

- [Descripción](#-descripción)
- [Funcionalidades principales](#-funcionalidades-principales)
- [Arquitectura](#️-arquitectura)
- [Stack tecnológico](#️-stack-tecnológico)
- [Asistente de IA (MCP)](#-asistente-de-ia-mcp)
- [Documentación](#-documentación)
- [Manual de despliegue](#-manual-de-despliegue)
  - [Requisitos previos](#requisitos-previos)
  - [Estructura de contenedores](#estructura-de-contenedores)
  - [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
  - [Puesta en marcha](#puesta-en-marcha)
  - [Acceso al sistema](#acceso-al-sistema)
  - [Verificación del despliegue](#verificación-del-despliegue)
- [Líneas de trabajo futuro](#-líneas-de-trabajo-futuro)
- [Autor](#-autor)
- [Agradecimientos](#-agradecimientos)

---

## Descripción

El proyecto consiste en una plataforma web pensada para entrenadores personales y sus clientes, que centraliza la creación de ejercicios y rutinas, la asignación personalizada a cada cliente y el seguimiento detallado del rendimiento a lo largo del tiempo.

El sistema incorpora un asistente conversacional basado en un modelo de lenguaje (LLM) que permite al entrenador consultar el estado de sus clientes en lenguaje natural, apoyándose en el Model Context Protocol (MCP) para acceder a los datos reales del sistema.

## Funcionalidades principales

**Entrenador**
- Gestión completa de un catálogo de ejercicios (crear, editar, archivar, clasificar por dificultad/grupo muscular).
- Diseño de rutinas estructuradas por bloques y días de la semana.
- Asignación de rutinas a clientes individuales, con personalización por cliente.
- Dashboard de análisis con métricas de cumplimiento, conformidad y evolución de cada cliente.
- Gestión de contenido multimedia (imágenes/vídeos) asociado a ejercicios.
- Asistente de IA para consultar el estado de sus clientes en lenguaje natural.

**Cliente**
- Consulta de la rutina asignada y del entrenamiento del día.
- Registro de rendimiento tras cada sesión (RPE, conformidad).
- Registro periódico de métricas físicas (peso, altura, % de grasa corporal).
- Visualización de su propia evolución mediante gráficos.

## Arquitectura

El sistema está desplegado como un conjunto de contenedores Docker independientes, comunicados mediante una red interna, con el frontend como único punto expuesto al exterior:

- **Frontend**: React + Vite
- **Backend**: FastAPI (Python), organizado en capas Models → Schemas → Services → Routers
- **Base de datos**: MySQL
- **Servidor MCP**: expone las herramientas del sistema al modelo de IA (FastMCP, transporte Streamable HTTP)
- **Modelo de IA local**: Ollama ejecutando Qwen2.5:7b

## Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| Base de datos | MySQL |
| IA / Asistente | Ollama (Qwen2.5:7b), Model Context Protocol (FastMCP) |
| Infraestructura | Docker, Docker Compose |
| Autenticación | JWT |

## Asistente de IA (MCP)

El asistente permite al entrenador hacer consultas como *"¿qué clientes tienen bajo cumplimiento este mes?"* directamente desde el chat. Internamente, el modelo de lenguaje decide qué herramientas del servidor MCP necesita invocar (p. ej. obtener el historial de un cliente, listar rutinas activas), consulta la API del sistema a través de dichas herramientas y genera una respuesta en lenguaje natural.

Como parte del TFG se realizó un experimento comparativo entre el modelo local (Qwen2.5:7b) y modelos externos (Claude Sonnet 4.6, Gemini Flash 2.5), evaluando coste, velocidad, privacidad y calidad de respuesta — detallado en la memoria del proyecto.

## Documentación

- 📄 **Memoria completa del TFG**: [enlace a Google Drive](https://drive.google.com/file/d/1yEjEA2T4Imwp7dS2sYRlnvfye9fofJSj/view?usp=drive_link)
- 📘 **Manual de usuario** (entrenador y cliente, con capturas de pantalla): [enlace a Google Drive](https://drive.google.com/file/d/1wLxSaxlcc8_fmguW34pgOoXNRKQN6Ccb/view?usp=sharing)
- 🛠️ **Manual de despliegue**: ver la sección siguiente, integrada directamente en este README

---

## Manual de despliegue

Este apartado describe el procedimiento para desplegar el sistema desde cero.

### Requisitos previos

Para desplegar el sistema es necesario tener **Docker** y **Docker Compose** instalados en el equipo, además de tener libres los siguientes puertos en el host:

| Puerto | Servicio |
|---|---|
| 3306 | Base de datos MySQL |
| 8080 | API del backend |
| 5173 | Aplicación frontend |
| 8001 | Servidor MCP |
| 11434 | Servidor Ollama |

### Estructura de contenedores

El sistema se compone de 5 contenedores Docker, cada uno encargado de ejecutar un servicio de manera independiente, orquestados con Docker Compose y comunicados mediante la red interna de Docker:

- **db**: sistema gestor de bases de datos MySQL, responsable del almacenamiento persistente de los datos.
- **backend**: ejecuta la API desarrollada con FastAPI para la lógica de negocio y el acceso a los datos.
- **frontend**: sirve la aplicación desarrollada con React para la interacción del usuario con el sistema.
- **mcp**: ejecuta el servidor MCP encargado de exponer las herramientas para el modelo de lenguaje.
- **ollama**: ejecuta el modelo de lenguaje local mediante Ollama.

Para garantizar la persistencia de los datos entre reinicios o recreaciones de los contenedores, se emplean los siguientes volúmenes nombrados de Docker:

- **db_data**: almacena los datos de la base de datos MySQL.
- **media_data**: almacena los archivos multimedia (imágenes y vídeos).
- **ollama_data**: almacena los modelos de lenguaje descargados por Ollama.

### Configuración de variables de entorno

El sistema utiliza el archivo `backend/.env` para gestionar las variables de entorno reales. Este archivo **no se versiona** en el repositorio ya que contiene información sensible. Para facilitar el despliegue se proporciona la plantilla `backend/env.example`.

| Variable | Descripción | ¿Requiere cambio? |
|---|---|---|
| `DB_HOST` | Host de MySQL. Debe ser `db`, nombre del servicio en `docker-compose.yml`. | No, si se usa Docker Compose tal cual. |
| `DB_PORT` | Puerto de MySQL. | No (3306 por defecto). |
| `DB_NAME` | Nombre de la base de datos. | No (`web_entrenadores`). |
| `DB_USER` | Usuario de MySQL. Debe coincidir con `MYSQL_USER` del servicio `db`. | — |
| `DB_PASSWORD` | Contraseña de MySQL. | Sí, debe coincidir con `MYSQL_PASSWORD` del servicio `db`. |
| `SECRET_KEY` | Clave usada para firmar los tokens JWT. | Sí, obligatorio generar una cadena aleatoria propia. |
| `ALGORITHM` | Algoritmo de firma de los JWT. | No (`HS256`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Minutos de validez del token de acceso. | Opcional. |
| `OLLAMA_URL` | Endpoint del servidor Ollama para el chat con IA. | No, si Ollama corre como servicio en el mismo `docker-compose.yml`. |
| `OLLAMA_MODEL` | Modelo de Ollama empleado en las respuestas del chat. | Solo si se desea usar un modelo distinto a `qwen2.5:7b`. |
| `MCP_URL` | Endpoint del servidor MCP. | No, si corre como servicio en el mismo `docker-compose.yml`. |

### Puesta en marcha

Una vez configuradas las variables de entorno, el despliegue se realiza siguiendo estos pasos.

**1. Clonar el repositorio**

```bash
git clone <url-del-repositorio>
cd web_entrenadores
```

**2. Levantar los contenedores**

Se levantan los cinco servicios del sistema con el siguiente comando:

```bash
docker compose up --build
```

Para evitar errores de conexión durante el arranque, se hace uso del mecanismo de `healthcheck` configurado en el servicio `db` junto con la directiva `depends_on` con condición `service_healthy`. De esta manera, los servicios arrancan sin problema.

En este punto, la aplicación ya es completamente funcional (inicio de sesión, registro, gestión de rutinas, ejercicios, clientes, métricas y analíticas), a excepción del asistente de inteligencia artificial, que requiere el paso descrito a continuación.

**3. Descargar el modelo de Ollama**

Este paso es necesario solamente la primera vez que se despliega el sistema, o si los volúmenes de Docker han sido eliminados previamente. Con los contenedores en ejecución, se ejecuta en otra terminal:

```bash
docker exec -it web_entrenadores_ollama ollama pull qwen2.5:7b
```

De esta manera se descarga el modelo de lenguaje y se almacena en el volumen `ollama_data`, por lo que no es necesario repetir este paso en arranques posteriores mientras no se elimine el volumen (`docker compose down -v`).

Si se quiere usar un modelo diferente, debe modificarse la variable `OLLAMA_MODEL` en el archivo `.env` y descargar el nuevo modelo siguiendo el mismo procedimiento.

### Acceso al sistema

Una vez completados los pasos anteriores, el sistema es accesible en:

- **Frontend**: http://localhost:5173
- **Documentación interactiva de la API (Swagger)**: http://localhost:8080/docs

### Verificación del despliegue

Se recomienda comprobar el correcto funcionamiento de cada componente del sistema.

**Backend**

El backend expone un endpoint de estado:

```bash
curl http://localhost:8080/health
```

La respuesta esperada es `{"status": "ok"}`. Esta comprobación es superficial, ya que únicamente confirma que el proceso de FastAPI está en ejecución. Si este endpoint responde correctamente pero la aplicación falla al iniciar sesión, es probable que el problema se encuentre en la base de datos.

**Frontend**

La aplicación debe ser accesible en http://localhost:5173, mostrando la pantalla de presentación del sistema. Si el navegador muestra un error de conexión rechazada, es posible que el contenedor no haya llegado a arrancar correctamente.

**Documentación interactiva de la API**

FastAPI genera automáticamente documentación interactiva de todos los endpoints disponibles en http://localhost:8080/docs (Swagger UI), donde puede comprobarse que todos los routers del sistema (`auth`, `users`, `exercises`, etc.) están correctamente registrados.

**Base de datos**

El servicio `db` no expone un endpoint propio, pero puede comprobarse directamente:

```bash
docker exec -it web_entrenadores_db mysqladmin ping -h localhost -u root -proot
```

La comprobación más completa consiste en realizar un registro de usuario desde Swagger (`POST /api/v1/auth/register`) y verificar que la respuesta es `201` junto con un token de acceso.

**Asistente de inteligencia artificial**

El chat con el asistente no dispone de un endpoint de salud propio, por lo que su verificación es funcional: basta con iniciar sesión como entrenador y enviar un mensaje al asistente. En caso de fallo, puede comprobarse cada componente por separado:

```bash
curl http://localhost:11434/api/tags
curl http://localhost:8001/mcp
```

---

## Líneas de trabajo futuro

- Gestión de grupos de clientes (no solo asignación individual).
- Sistema de invitación a clientes (solicitud/aceptación en lugar de alta manual).
- Refresh tokens para revocación segura de sesiones.
- Modelos locales de mayor capacidad conforme mejore el hardware disponible.

## Autor

**Álvaro Rodríguez González**
Graduado en Ciencia e Ingeniería de Datos — ULPGC
Tutor: Francisco Alexis Quesada Arencibia

## Agradecimientos

A Alexis, por su guía durante todo el desarrollo. A Adriana y Miguel, por su asesoramiento como profesionales del fitness en el diseño de la herramienta. Y a mi familia, amigos y compañeros, por su apoyo durante todo el proceso.
