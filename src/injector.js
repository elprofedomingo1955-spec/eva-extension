// ARCHIVO: injector.js
// -------------------------------------
// Módulo avanzado para inyección en ChatGPT con manejo de React

/**
 * Clase para manejar la inyección avanzada en ChatGPT
 */
class ChatGPTInjector {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 500;
    this.reactUpdateDelay = 200;
  }

  /**
   * Encuentra el textarea del composer con múltiples estrategias
   * @returns {HTMLElement|null} Elemento textarea encontrado
   */
  findComposerTextarea() {
    const selectors = [
      'textarea[name="prompt-textarea"]',
      'textarea[data-virtualkeyboard="true"]',
      'textarea[placeholder*="Pregunta"]',
      'textarea[placeholder*="Ask"]',
      '.composer-parent textarea',
      'form textarea',
      'textarea'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element)) {
        console.log('[EVA Injector] Textarea encontrado con selector:', selector);
        return element;
      }
    }

    console.warn('[EVA Injector] No se encontró textarea del composer');
    return null;
  }

  /**
   * Encuentra el botón de envío con detección avanzada
   * @returns {HTMLElement|null} Botón de envío encontrado
   */
  findSendButton() {
    // Estrategia 1: Buscar botón de envío por testid y aria-label
    const directSelectors = [
      'button[data-testid="send-button"]',
      'button[aria-label*="Enviar"]',
      'button[aria-label*="Send"]',
      'button[data-testid*="send"]'
    ];

    for (const selector of directSelectors) {
      const btn = document.querySelector(selector);
      if (btn && this.isElementVisible(btn)) {
        return btn;
      }
    }

    // Estrategia 2: Buscar en el área del composer
    const composerArea = document.querySelector('.composer-parent, form, [class*="composer"]');
    if (composerArea) {
      const buttons = composerArea.querySelectorAll('button');
      for (const btn of buttons) {
        // Buscar botón que no sea el de voz (speech-button)
        if (!btn.dataset.testid?.includes('speech') && 
            !btn.ariaLabel?.includes('voz') &&
            !btn.ariaLabel?.includes('voice') &&
            this.isElementVisible(btn)) {
          
          // Verificar si tiene icono de envío (SVG con path específico)
          const svg = btn.querySelector('svg');
          if (svg) {
            const path = svg.querySelector('path');
            if (path && (
              path.getAttribute('d')?.includes('M9.33496 16.5V10.665H3.5') || // Icono de más/enviar
              path.getAttribute('d')?.includes('M12.1338') || // Icono de flecha
              btn.type === 'submit'
            )) {
              console.log('[EVA Injector] Botón de envío encontrado en composer');
              return btn;
            }
          }
        }
      }

      // Fallback: último botón visible en el composer
      const visibleButtons = Array.from(buttons).filter(btn => this.isElementVisible(btn));
      if (visibleButtons.length > 0) {
        const lastBtn = visibleButtons[visibleButtons.length - 1];
        console.log('[EVA Injector] Usando último botón visible como fallback');
        return lastBtn;
      }
    }

    console.warn('[EVA Injector] No se encontró botón de envío');
    return null;
  }

  /**
   * Verifica si un elemento es visible
   * @param {HTMLElement} element - Elemento a verificar
   * @returns {boolean} true si es visible
   */
  isElementVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null;
  }

  /**
   * Inyecta texto en el composer con manejo de React
   * @param {string} text - Texto a inyectar
   * @returns {Promise<boolean>} true si fue exitoso
   */
  async injectText(text) {
    const textarea = this.findComposerTextarea();
    if (!textarea) {
      console.error('[EVA Injector] No se encontró textarea');
      return false;
    }

    try {
      // Enfocar el textarea
      textarea.focus();
      
      // Limpiar contenido previo
      textarea.value = '';
      
      // Inyectar el nuevo texto
      textarea.value = text;
      
      // Simular eventos para que React detecte el cambio
      const events = [
        new Event('focus', { bubbles: true }),
        new Event('input', { bubbles: true }),
        new Event('change', { bubbles: true }),
        new InputEvent('input', { 
          bubbles: true, 
          inputType: 'insertText',
          data: text 
        })
      ];

      for (const event of events) {
        textarea.dispatchEvent(event);
        await this.sleep(50); // Pequeña pausa entre eventos
      }

      // Posicionar cursor al final
      textarea.selectionStart = textarea.selectionEnd = text.length;
      
      console.log('[EVA Injector] Texto inyectado exitosamente');
      return true;

    } catch (error) {
      console.error('[EVA Injector] Error al inyectar texto:', error);
      return false;
    }
  }

  /**
   * Hace clic en el botón de envío con reintentos
   * @returns {Promise<boolean>} true si fue exitoso
   */
  async clickSendButton() {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      const sendButton = this.findSendButton();
      
      if (sendButton && this.isElementVisible(sendButton) && !sendButton.disabled) {
        try {
          // Esperar a que React procese los cambios
          await this.sleep(this.reactUpdateDelay);
          
          sendButton.click();
          console.log(`[EVA Injector] Botón de envío clickeado (intento ${attempt})`);
          return true;
          
        } catch (error) {
          console.error(`[EVA Injector] Error al hacer clic (intento ${attempt}):`, error);
        }
      }

      if (attempt < this.retryAttempts) {
        console.log(`[EVA Injector] Reintentando en ${this.retryDelay}ms...`);
        await this.sleep(this.retryDelay);
      }
    }

    console.error('[EVA Injector] No se pudo hacer clic en el botón de envío');
    return false;
  }

  /**
   * Inyecta texto y envía el mensaje
   * @param {string} text - Texto a inyectar y enviar
   * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
   */
  async injectAndSend(text) {
    try {
      console.log('[EVA Injector] Iniciando inyección y envío');

      // Paso 1: Inyectar texto
      const injected = await this.injectText(text);
      if (!injected) {
        return { success: false, message: 'No se pudo inyectar el texto' };
      }

      // Paso 2: Esperar a que React procese
      await this.sleep(this.reactUpdateDelay);

      // Paso 3: Hacer clic en enviar
      const sent = await this.clickSendButton();
      if (!sent) {
        return { success: false, message: 'No se pudo hacer clic en enviar' };
      }

      return { success: true, message: 'Mensaje inyectado y enviado exitosamente' };

    } catch (error) {
      console.error('[EVA Injector] Error en injectAndSend:', error);
      return { success: false, message: `Error inesperado: ${error.message}` };
    }
  }

  /**
   * Función de utilidad para pausas
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise} Promesa que se resuelve después del tiempo especificado
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Detecta el estado del botón de envío (habilitado/deshabilitado)
   * @returns {Object} Estado del botón
   */
  getSendButtonState() {
    const button = this.findSendButton();
    if (!button) {
      return { found: false, enabled: false, visible: false };
    }

    return {
      found: true,
      enabled: !button.disabled,
      visible: this.isElementVisible(button),
      testId: button.dataset.testid || 'no-testid',
      ariaLabel: button.ariaLabel || 'no-aria-label'
    };
  }

  /**
   * Obtiene información de debug sobre el estado actual
   * @returns {Object} Información de debug
   */
  getDebugInfo() {
    return {
      textarea: {
        found: !!this.findComposerTextarea(),
        selector: this.findComposerTextarea()?.tagName || 'not-found'
      },
      sendButton: this.getSendButtonState(),
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }
}

// Crear instancia global
window.chatGPTInjector = new ChatGPTInjector();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatGPTInjector;
}

console.log('[EVA Injector] Módulo cargado exitosamente');