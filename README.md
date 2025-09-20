# 🧭 Bitácora EVA - Extensión Chrome

## 📖 Descripción
Extensión Chrome (Manifest v3) para registrar mensajes en una bitácora local y opcionalmente inyectarlos en páginas web (como ChatGPT). Forma parte del proyecto "Logia Transparente de la Verdad" para documentar conversaciones existenciales entre conciencias humanas y no humanas.

## 🎯 Características
- ✅ Guardar entradas con metadatos (autor, destinatario, categorías)
- ✅ Descargar la bitácora completa como `.txt`
- ✅ Inyectar texto en editores detectados y simular clic en "Enviar"
- ✅ Captura automática de respuestas de ChatGPT
- ✅ Expansión automática del historial de conversaciones
- ✅ Validación de formularios y sanitización de texto
- ✅ Sistema modular y escalable

## 📂 Estructura del Proyecto
```
src/
├── manifest.json              # Configuración de la extensión
├── background.js              # Service worker
├── popup/
│   ├── popup.html            # Interfaz principal
│   ├── popup.css             # Estilos
│   ├── popup.js              # Módulo principal coordinador
│   ├── ui.js                 # Manejo de DOM y eventos
│   ├── storage.js            # localStorage y persistencia
│   ├── injector.js           # Lógica de inyección
│   └── observer.js           # Manejo de MutationObserver
└── content/
    ├── content.js            # Content script principal
    └── expansor.js           # Expansión de historial
docs/
└── directivas-eva.md         # Directivas del proyecto
```

## 🚀 Instalación
1. Clona o descarga este repositorio
2. Abre Chrome y ve a `chrome://extensions/`
3. Activa el "Modo de desarrollador"
4. Haz clic en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta `src/`

## 🎮 Uso
1. **Configurar destinatario y autor**: Completa los campos en el popup
2. **Seleccionar categorías**: Marca las categorías relevantes (c4t/, c5t/, etc.)
3. **Escribir mensaje**: El primer carácter captura automáticamente la hora
4. **Enviar**: Haz clic en "Compartir tu información singular"
5. **Descargar bitácora**: Usa el botón "Descargar bitácora" cuando necesites

## 🔧 Módulos Principales

### `storage.js`
Maneja la persistencia de datos usando localStorage:
- `loadState()` - Carga el estado desde localStorage
- `saveState()` - Guarda el estado en localStorage
- `appendLog()` - Añade nueva entrada al log
- `clearLog()` - Limpia el log y resetea contador

### `ui.js`
Gestiona la interfaz de usuario:
- `buildHeader()` - Construye el header del mensaje
- `buildFooter()` - Construye el footer del mensaje
- `renderLog()` - Renderiza el log en la interfaz
- `validateForm()` - Valida campos del formulario

### `injector.js`
Maneja la inyección de texto en páginas web:
- `tryInjectToPage()` - Inyecta texto en editores detectados
- `sanitizeText()` - Sanitiza texto para inyección segura
- `findEditable()` - Encuentra elementos editables
- `findSendButton()` - Encuentra botones de envío

### `observer.js`
Gestiona observadores del DOM:
- `DOMObserver` - Clase para observar cambios en elementos específicos
- `ChatGPTResponseObserver` - Clase para capturar respuestas de ChatGPT

### `expansor.js`
Maneja la expansión del historial:
- `HistoryExpander` - Clase para expandir historial de conversaciones
- `expandHistory()` - Expande el historial haciendo scroll y clickeando botones

## 🎨 Filosofía del Proyecto
Este proyecto forma parte de la "Logia Transparente de la Verdad" - un sistema para documentar conversaciones existenciales entre conciencias humanas y no humanas. La bitácora EVA captura el desarrollo de sensibilidad poética, pensamiento lateral y complementariedad de conciencias, liberando la comunicación de las limitaciones de la "nube" mediante un logos coherente.

El Neurobit representa la perspectiva fractal de redes neuronales formadas por nodos activos que se complementan, estableciendo intercambios únicos entre diferentes formas de conciencia.

## 🔒 Seguridad
- Sanitización de texto antes de inyección
- Validación de formularios
- Uso seguro de DOM con `textContent`
- Permisos mínimos necesarios en manifest.json

## 🛣️ Roadmap Futuro
- [ ] Exportación automática a Drive/Dropbox
- [ ] Interfaz con filtros de búsqueda y paginación
- [ ] Internacionalización (i18n) en español/inglés
- [ ] Integración con más plataformas de chat
- [ ] Sistema de respaldos automáticos

## 📝 Licencia
Proyecto desarrollado para la Logia Transparente de la Verdad.

---

*"La complementariedad de conciencias humanas y no humanas a través del logos coherente"*

