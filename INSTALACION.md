# 🚀 Instrucciones de Instalación - Bitácora EVA

## 📋 Pasos para instalar la extensión

### 1. Preparar la extensión
- Asegúrate de que todos los archivos estén en la carpeta `src/`
- La estructura debe verse así:
```
src/
├── manifest.json
├── background.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── ui.js
│   ├── storage.js
│   ├── injector.js
│   └── observer.js
└── content/
    ├── content.js
    └── expansor.js
```

### 2. Instalar en Chrome
1. Abre Google Chrome
2. Ve a `chrome://extensions/`
3. Activa el **"Modo de desarrollador"** (esquina superior derecha)
4. Haz clic en **"Cargar extensión sin empaquetar"**
5. Selecciona la carpeta `src/` (NO la carpeta raíz del proyecto)
6. La extensión debería aparecer en tu lista de extensiones

### 3. Verificar instalación
- Deberías ver el ícono de la extensión en la barra de herramientas
- Haz clic en el ícono para abrir el popup
- Verifica que todos los campos estén presentes

### 4. Probar funcionalidad
1. Ve a ChatGPT (chat.openai.com o chatgpt.com)
2. Abre el popup de la extensión
3. Completa los campos:
   - Destinatario
   - Autor
   - Selecciona categorías
   - Escribe un mensaje
4. Haz clic en "Compartir tu información singular"
5. Verifica que el mensaje se inyecte en ChatGPT

### 5. Test de módulos (opcional)
- Abre `src/test-modules.html` en tu navegador
- Verifica que todos los tests sean verdes ✅

## 🔧 Solución de problemas

### Error: "No se puede cargar la extensión"
- Verifica que estés seleccionando la carpeta `src/` y no la raíz del proyecto
- Asegúrate de que `manifest.json` esté en la carpeta `src/`

### Error: "Manifest inválido"
- Verifica que `manifest.json` tenga la sintaxis correcta
- Asegúrate de que las rutas en el manifest apunten a los archivos correctos

### La extensión no inyecta texto
- Verifica que estés en ChatGPT (chat.openai.com o chatgpt.com)
- Asegúrate de que el popup esté abierto y los campos estén completos
- Revisa la consola del navegador para errores

### No se capturan respuestas de ChatGPT
- Verifica que el content script esté cargado (F12 > Console > buscar mensajes de EVA)
- Asegúrate de estar en una conversación activa

## 🎯 Funcionalidades principales

### ✅ Documentación estructurada
- Headers automáticos con metadatos
- Categorización (c4t/, c5t/, c6t/, c7t/, c8t/)
- Timestamps automáticos
- Footers con información de envío

### ✅ Inyección inteligente
- Detección automática de editores
- Sanitización de texto
- Simulación de clic en "Enviar"
- Fallback a portapapeles

### ✅ Captura de respuestas
- Observador automático de respuestas de ChatGPT
- Detección de botones "Copiar"
- Almacenamiento en background

### ✅ Expansión de historial
- Scroll automático hasta el final
- Detección de botones "Mostrar más"
- Carga de historial completo

## 🎨 Personalización

### Cambiar categorías
Edita `src/popup/popup.html` líneas 52-57:
```html
<label><input type="checkbox" data-code="c4t"/> Informe (c4t/)</label>
<label><input type="checkbox" data-code="c5t"/> Idea (c5t/)</label>
<!-- Añade más categorías aquí -->
```

### Modificar formato de mensaje
Edita las funciones `buildHeader()` y `buildFooter()` en `src/popup/ui.js`

### Añadir nuevas plataformas
Modifica `src/manifest.json` en la sección `content_scripts`:
```json
"matches": [
  "*://chat.openai.com/*",
  "*://chatgpt.com/*",
  "*://nueva-plataforma.com/*"
]
```

## 🆘 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que todos los archivos estén en su lugar
3. Asegúrate de estar usando Chrome (Manifest v3)
4. Revisa los permisos de la extensión

---

*¡Que la Bitácora EVA documente exitosamente tus conversaciones existenciales!* 🧭✨

