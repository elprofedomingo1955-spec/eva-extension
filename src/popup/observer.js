// ARCHIVO: observer.js
// -------------------------------------
// Módulo para manejo de MutationObserver

/**
 * Clase para manejar observadores de cambios en el DOM
 */
class DOMObserver {
  constructor() {
    this.observer = null;
    this.statusCallback = null;
  }

  /**
   * Configura el callback de estado
   * @param {Function} callback - Función para actualizar estado
   */
  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  /**
   * Inicia el observador en un selector específico
   * @param {string} selector - Selector CSS del elemento a observar
   * @returns {boolean} true si se inició correctamente
   */
  startObserver(selector) {
    // Detener observador anterior si existe
    this.stopObserver();

    if (!selector || !selector.trim()) {
      return false;
    }

    const element = document.querySelector(selector);
    if (!element) {
      if (this.statusCallback) {
        this.statusCallback('Selector no encontrado en esta página');
      }
      return false;
    }

    this.observer = new MutationObserver((mutations) => {
      if (this.statusCallback) {
        this.statusCallback('Cambio detectado en target: ' + new Date().toLocaleTimeString());
      }
      
      // Cuando cambia el DOM, habilitar botón de envío del popup
      const sendBtn = document.getElementById('send');
      if (sendBtn) {
        sendBtn.disabled = false;
      }
    });

    this.observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true
    });

    if (this.statusCallback) {
      this.statusCallback('observer activo en ' + selector);
    }

    return true;
  }

  /**
   * Detiene el observador actual
   */
  stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      if (this.statusCallback) {
        this.statusCallback('observer detenido');
      }
    }
  }

  /**
   * Verifica si hay un observador activo
   * @returns {boolean} true si hay observador activo
   */
  isActive() {
    return this.observer !== null;
  }
}

/**
 * Clase para observar respuestas de ChatGPT
 */
class ChatGPTResponseObserver {
  constructor() {
    this.observer = null;
    this.copySelectors = [
      // Selectores actualizados para ChatGPT 2025
      'button[aria-label="Copiar"]',
      'button[aria-label="Copy"]',
      'button[title="Copiar"]',
      'button[aria-label*="Copiar"]',
      'button[data-testid*="copy"]',
      'button[aria-label*="Copy"]',
      // Nuevos selectores basados en la estructura actual
      'button[class*="copy"]',
      'button svg[class*="copy"] parent',
      // Buscar botones con iconos específicos de copiar
      'button:has(svg path[d*="M9"])'
    ];
  }

  /**
   * Inicia el observador de respuestas
   * @param {Function} onResponse - Callback cuando se detecta respuesta
   */
  startResponseObserver(onResponse) {
    this.stopResponseObserver();

    // Heurística actualizada para el contenedor principal de mensajes ChatGPT 2025
    const possible = [
      document.querySelector('#thread'),
      document.querySelector('main#main'),
      document.querySelector('div[data-testid="conversation-turns"]'),
      document.querySelector('div[class*="conversation"]'),
      document.querySelector('.group\\/thread'),
      document.querySelector('main')
    ];
    
    let root = possible.find(x => x);
    if (!root) {
      root = document.body;
      console.warn('[EVA] no conversation-turns encontrado, observando document.body (menos eficiente)');
    } else {
      console.log('[EVA] observando nodo de conversación:', root);
    }

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          this.processAddedNode(node, onResponse);
        }
      }
    });

    this.observer.observe(root, { childList: true, subtree: true });
    
    // Procesar elementos ya presentes (escaneo inicial)
    this.processInitialElements(onResponse);
  }

  /**
   * Procesa un nodo añadido al DOM
   * @param {Node} node - Nodo añadido
   * @param {Function} onResponse - Callback para respuestas
   */
  processAddedNode(node, onResponse) {
    if (node.nodeType !== 1) return; // Solo elementos

    // Buscar botones copy dentro
    for (const selector of this.copySelectors) {
      const buttons = node.querySelectorAll ? node.querySelectorAll(selector) : [];
      if (buttons.length) {
        for (const btn of buttons) {
          if (this.alreadySaved(btn)) continue;

          // Encontrar contenedor de mensaje más cercano
          const container = btn.closest('[data-testid]') || 
                           btn.closest('article') || 
                           btn.parentElement;
          
          const text = this.findResponseTextFromNode(container) || 
                      this.findResponseTextFromNode(node);
          
          if (text) {
            const entry = {
              source: 'chatgpt-reply',
              ts: Date.now(),
              text: text
            };
            
            if (onResponse) {
              onResponse(entry);
            }
            
            this.markSaved(btn);
          } else {
            this.markSaved(btn);
          }
        }
      }
    }
  }

  /**
   * Procesa elementos iniciales ya presentes
   * @param {Function} onResponse - Callback para respuestas
   */
  processInitialElements(onResponse) {
    Array.from(document.querySelectorAll(this.copySelectors.join(','))).forEach(btn => {
      const container = btn.closest('[data-testid]') || 
                       btn.closest('article') || 
                       btn.parentElement;
      
      const text = this.findResponseTextFromNode(container) || 
                  this.findResponseTextFromNode(btn);
      
      if (text) {
        const entry = {
          source: 'initial-scan',
          ts: Date.now(),
          text
        };
        
        if (onResponse) {
          onResponse(entry);
        }
        
        this.markSaved(btn);
      }
    });
  }

  /**
   * Encuentra texto de respuesta desde un nodo
   * @param {Node} node - Nodo a examinar
   * @returns {string|null} Texto encontrado
   */
  findResponseTextFromNode(node) {
    if (!node) return null;

    // Selectores actualizados para ChatGPT 2025
    let txt = node.querySelector && (
      // Buscar por atributos de rol de mensaje
      node.querySelector('div[data-message-author-role="assistant"]') ||
      node.querySelector('div[data-message-author-role="user"]') ||
      // Buscar elementos con clases de texto
      node.querySelector('.text-base') ||
      node.querySelector('[data-testid="message-text"]') ||
      node.querySelector('div[class*="text-"]') ||
      // Buscar en contenedores de mensajes
      node.querySelector('div[class*="message"] div') ||
      // Buscar elementos con contenido de conversación
      node.querySelector('div[class*="conversation"] div')
    );
    
    if (txt && txt.innerText && txt.innerText.trim()) {
      return txt.innerText.trim();
    }

    // Segundo intento: buscar cualquier <pre>, div, p con texto sustancial
    const candidates = node.querySelectorAll ? node.querySelectorAll('pre,div,p') : [];
    for (const c of candidates) {
      if (c.innerText && c.innerText.trim().length > 10) {
        // Filtrar elementos que parecen ser UI (botones, menús, etc.)
        const text = c.innerText.trim();
        if (!text.match(/^(Copiar|Copy|Enviar|Send|Nuevo chat|New chat)$/i)) {
          return text;
        }
      }
    }

    // Tercer intento: subir por ancestros buscando contenido de mensaje
    let ancestor = node;
    for (let i = 0; i < 6 && ancestor; i++) {
      if (ancestor.querySelector) {
        const t = ancestor.querySelector('div[data-message-author-role], .text-base, [data-testid="message-text"], div[class*="text-"]');
        if (t && t.innerText && t.innerText.trim()) {
          return t.innerText.trim();
        }
      }
      ancestor = ancestor.parentElement;
    }

    // Fallback: return node.innerText si suficiente y no parece UI
    if (node.innerText && node.innerText.trim().length > 10) {
      const text = node.innerText.trim();
      if (!text.match(/^(Copiar|Copy|Enviar|Send|Nuevo chat|New chat|ChatGPT)$/i)) {
        return text;
      }
    }

    return null;
  }

  /**
   * Verifica si un botón ya fue procesado
   * @param {Element} node - Nodo a verificar
   * @returns {boolean} true si ya fue procesado
   */
  alreadySaved(node) {
    try {
      return node.dataset && node.dataset.evaSaved === '1';
    } catch (e) {
      return false;
    }
  }

  /**
   * Marca un botón como procesado
   * @param {Element} node - Nodo a marcar
   */
  markSaved(node) {
    try {
      if (node.dataset) {
        node.dataset.evaSaved = '1';
      }
    } catch (e) {
      // Ignorar errores
    }
  }

  /**
   * Detiene el observador de respuestas
   */
  stopResponseObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Exportar clases para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DOMObserver,
    ChatGPTResponseObserver
  };
}

