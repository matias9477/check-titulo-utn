# 📡 Verificador automático del estado de título UTN

Este proyecto automatiza el seguimiento del trámite del título en el portal de la UTN. Una vez configurado, el script revisa todos los días si hubo cambios en el estado del expediente y te avisa por correo si hay novedades.

Ideal para quienes revisan todos los días a mano y quieren olvidarse ✨

---

## ⚙️ Requisitos

- Node.js 18+ (se recomienda usar [nvm](https://github.com/nvm-sh/nvm))
- Cuenta en [Resend](https://resend.com) para enviar correos (gratuita)
- Sistema operativo compatible con `cron` (Linux/macOS)

---

## 🚀 Instalación

### 1. Cloná el repositorio

```
git clone https://github.com/tu-usuario/check-titulo-utn.git
cd check-titulo-utn
```

### 2. Instalá las dependencias

```
npm install
```

### 3. Configurá el archivo `.env`

Creá un archivo llamado `.env` en la raíz del proyecto con este contenido:

```
UTN_USERNAME=tu_usuario_documento
UTN_PASSWORD=tu_contraseña

RESEND_API_KEY=tu_api_key_de_resend
FROM_EMAIL=Estado UTN <onboarding@resend.dev>
TO_EMAIL=tu_correo@ejemplo.com
```

> ⚠️ Tu usuario es el que usás para ingresar al portal de trámites académicos.  
> ✅ `onboarding@resend.dev` funciona bien para pruebas con Resend.

---

## 🧪 Probarlo manualmente

Ejecutá el script así:

```
node check-titulo.js
```

Si todo está bien, verás en la consola:

- Si hubo cambios: `🔔 Se detectaron cambios y se envió un email.`
- Si no hubo cambios: `Sin cambios detectados.`

---

## 🕔 Programarlo para que corra todos los días

### 1. Verificá la ruta a Node

```
which node
```

Te devolverá algo como:

```
/Users/matiasturra/.nvm/versions/node/v18.12.0/bin/node
```

### 2. Crear un script para ejecutar con entorno NVM

Creá un archivo `run-check.sh` con el siguiente contenido:

```
#!/bin/bash
source ~/.nvm/nvm.sh
nvm use 18
cd /Users/matiasturra/Projects/check-titulo
node check-titulo.js
```

Hacelo ejecutable:

```
chmod +x run-check.sh
```

### 3. Editá tu crontab

```
crontab -e
```

### 4. Agregá una línea como esta (por ejemplo, todos los días a las 11:15):

```
15 11 * * * /Users/matiasturra/Projects/check-titulo/run-check.sh >> /Users/matiasturra/Projects/check-titulo/titulo.log 2>&1
```

Esto asegura que se cargue correctamente el entorno NVM y las variables `.env` cuando el cron se ejecute.

---

## 🛡️ Seguridad

El archivo `.env` contiene información sensible y **no debe subirse al repositorio**. Asegurate de que esté en el `.gitignore`.

---

## 📁 Estructura del proyecto

```
check-titulo-utn/
│
├── check-titulo.js       # Script principal
├── run-check.sh          # Script para cron (ignorado por Git)
├── .env                  # Variables sensibles (no se sube)
├── .gitignore            # Ignora archivos privados
├── package.json          # Dependencias
└── estado.json           # Historial local de últimos estados
```

---

## 📄 `.gitignore`

Asegurate de tener este archivo para evitar subir archivos sensibles:

```
.env
estado.json
titulo.log
node_modules/
run-check.sh
```

---

## 🙌 Contribuciones

¿Querés sumar soporte para Telegram, notificaciones push o interfaz visual? ¡Las PRs son bienvenidas!

---

## 📫 Contacto

Hecho por [Matías Turra](https://github.com/matias9477) — si esto te sirvió, dejá una estrella ⭐
