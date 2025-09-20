// popup.js

// Estado global
let state = null;
let lastSent = null;
let domObserver = null;
let chatGPTObserver = null;

async function getActiveTab(){
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

/**
 * Intenta inyectar texto en la página de ChatGPT
 * @param {string} text - Texto a inyectar
 * @param {Function} statusCallback - Callback para actualizar estado
 * @returns {Promise<boolean>} true si fue exitoso
 */
async function tryInjectToPage(text, statusCallback) {
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.url || !tab.url.includes('chatgpt.com')) {
      if (statusCallback) statusCallback('No estás en ChatGPT');
      return false;
    }

    // Enviar mensaje al content script
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'INJECT_AND_SEND',
        text: text
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[EVA Popup] Error al comunicar con content script:', chrome.runtime.lastError);
          if (statusCallback) statusCallback('Error: content script no responde');
          resolve(false);
          return;
        }

        if (response && response.ok) {
          if (statusCallback) statusCallback('Mensaje inyectado exitosamente');
          resolve(true);
        } else {
          const reason = response ? response.reason : 'respuesta vacía';
          if (statusCallback) statusCallback(`Error: ${reason}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('[EVA Popup] Error en tryInjectToPage:', error);
    if (statusCallback) statusCallback('Error inesperado');
    return false;
  }
}

/**
 * Inicializa la aplicación
 */
function init() {
  console.log('[EVA Popup] Inicializando aplicación');

  // Cargar estado inicial
  state = loadState();
  if (!state.arr) state.arr = [];
  if (!state.counter) state.counter = 1;

  // Inicializar observadores
  domObserver = new DOMObserver();
  chatGPTObserver = new ChatGPTResponseObserver();

  // Configurar callbacks
  domObserver.setStatusCallback(setStatus);
  chatGPTObserver.startResponseObserver(handleChatGPTResponse);

  // Configurar event listeners adicionales
  setupEventListeners({
    sendMessage: handleSendMessage,
    repeatLast: handleRepeatLast,
    downloadLog: handleDownloadLog,
    clearLog: handleClearLog,
    injectMessage: handleInjectMessage,
    handleObserverSelectorChange: handleObserverSelectorChange
  });

  // Renderizar interfaz inicial
  renderLog(state.arr, state.counter);

  console.log('[EVA Popup] Aplicación inicializada correctamente');
}

/**
 * Maneja el envío de mensajes
 */
async function handleSendMessage() {
  console.log('[EVA Popup] Procesando envío de mensaje');

  // Validar formulario
  const validation = validateForm();
  if (!validation.valid) {
    alert('Errores en el formulario:\n' + validation.errors.join('\n'));
    return;
  }

  const text = DOM_REFS.message.value;
  const id = state.counter || 1;
  const recipient = DOM_REFS.recipient.value.trim() || 'DESTINATARIO_NO_DEFINIDO';
  const author = DOM_REFS.author.value.trim() || 'AUTOR_NO_DEFINIDO';
  const channel = DOM_REFS.channel.value.trim() || '';
  const categories = getCheckedCategories();
  const extra1 = document.getElementById('extra1').value.trim();
  const extra2 = document.getElementById('extra2').value.trim();
  const ts = Date.now();
  const header = buildHeader(id);
  const footer = buildFooter();
  const fullMessage = header + text + footer;

  // Mostrar modal de confirmación
  showModal(fullMessage, async (editedText) => {
    // Al confirmar, proceder con envío
    const entry = {
      id,
      ts,
      author,
      recipient,
      channel,
      categories,
      extra1,
      extra2,
      body: text,
      editedBody: editedText,
      header,
      footer
    };
    state = appendLog(entry, state);
    lastSent = entry;

    setStatus('enviando...');

    // Intentar inyectar en la página
    try {
      const success = await tryInjectToPage(editedText, setStatus);
      if (success) {
        setStatus('mensaje enviado exitosamente');
      } else {
        setStatus('error al enviar mensaje');
      }
    } catch (error) {
      console.error('[EVA Popup] Error al inyectar mensaje:', error);
      setStatus('error al inyectar mensaje');
    }

    // Limpiar textarea para el siguiente fragmento
    DOM_REFS.message.value = '';
    updateCharCount('');

    // Actualizar interfaz
    renderLog(state.arr, state.counter);
  });
}

/**
 * Captura la última respuesta de ChatGPT y la pone en el textarea
 */
async function handleRepeatLast() {
  console.log('[EVA Popup] Capturando última respuesta de ChatGPT...');
  setStatus('capturando última respuesta...');
  
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.url || !tab.url.includes('chatgpt.com')) {
      alert('Debes estar en una pestaña de ChatGPT');
      setStatus('error: no estás en ChatGPT');
      return;
    }

    // Solicitar la última respuesta al content script
    chrome.tabs.sendMessage(tab.id, { action: 'GET_LAST' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[EVA Popup] Error al comunicar con content script:', chrome.runtime.lastError);
        setStatus('error: content script no responde');
        return;
      }

      if (response && response.text) {
        // Poner la respuesta en el textarea del popup
        DOM_REFS.message.value = response.text;
        updateCharCount(response.text);
        setStatus('última respuesta capturada y cargada en textarea');
        
        // Enfocar el textarea para que el usuario pueda editarla
        DOM_REFS.message.focus();
        
        console.log('[EVA Popup] Respuesta capturada:', response.text.substring(0, 100) + '...');
      } else {
        setStatus('no se encontró respuesta para capturar');
        alert('No se encontró ninguna respuesta de ChatGPT para capturar');
      }
    });
    
  } catch (error) {
    console.error('[EVA Popup] Error al capturar respuesta:', error);
    setStatus('error al capturar respuesta');
  }
}

/**
 * Descarga la bitácora completa como JSON
 */
function handleDownloadLog() {
  console.log('[EVA Popup] Descargando bitácora como JSON');

  try {
    const content = JSON.stringify(state.arr, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `bitacora_${(new Date()).toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setStatus('bitácora JSON descargada');
  } catch (error) {
    console.error('[EVA Popup] Error al descargar bitácora:', error);
    setStatus('error al descargar bitácora');
  }
}

/**
 * Descarga archivos JSON secuenciales
 */
function handleDownloadSequential() {
  console.log('[EVA Popup] Descargando archivos JSON secuenciales');

  try {
    state.arr.forEach((entry, index) => {
      const content = JSON.stringify(entry, null, 2);
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `mensaje_${entry.id}_${(new Date(entry.ts)).toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    setStatus('archivos JSON secuenciales descargados');
  } catch (error) {
    console.error('[EVA Popup] Error al descargar secuencial:', error);
    setStatus('error al descargar secuencial');
  }
}

/**
 * Limpia la bitácora actual
 */
function handleClearLog() {
  if (!confirm('Crear nueva bitácora y borrar la actual?')) {
    return;
  }
  
  console.log('[EVA Popup] Limpiando bitácora');
  state = clearLog();
  lastSent = null;
  renderLog(state.arr, state.counter);
  setStatus('nueva bitácora creada');
}

/**
 * Inyecta mensaje manualmente
 */
async function handleInjectMessage() {
  const text = DOM_REFS.message.value || (lastSent && lastSent.body) || '';
  if (!text) {
    alert('Nada para inyectar');
    return;
  }
  
  console.log('[EVA Popup] Inyección manual de mensaje');
  setStatus('inyectando mensaje...');
  
  try {
    const success = await tryInjectToPage(text, setStatus);
    if (success) {
      setStatus('mensaje inyectado manualmente');
    } else {
      setStatus('error en inyección manual');
    }
  } catch (error) {
    console.error('[EVA Popup] Error en inyección manual:', error);
    setStatus('error en inyección manual');
  }
}

/**
 * Maneja respuestas de ChatGPT
 * @param {Object} entry - Entrada de respuesta
 */
function handleChatGPTResponse(entry) {
  console.log('[EVA Popup] Respuesta de ChatGPT recibida:', entry);
  
  // Enviar al background para guardar
  chrome.runtime.sendMessage({ type: 'EVA_SAVE_REPLY', entry }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[EVA Popup] Error al guardar respuesta:', chrome.runtime.lastError);
    } else {
      console.log('[EVA Popup] Respuesta guardada en background:', response);
      setStatus('respuesta de ChatGPT capturada');
    }
  });
}

/**
 * Maneja cambios en el selector de observador
 */
function handleObserverSelectorChange() {
  const selector = DOM_REFS.observerSelector.value.trim();

  if (selector) {
    const success = domObserver.startObserver(selector);
    if (!success) {
      // El error ya se mostró en el callback de estado
    }
  } else {
    domObserver.stopObserver();
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Exportar funciones principales para uso externo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    handleSendMessage,
    handleRepeatLast,
    handleDownloadLog,
    handleDownloadSequential,
    handleClearLog,
    handleInjectMessage
  };
}

