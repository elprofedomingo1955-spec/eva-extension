// content.js (inyectado en chat.openai.com)
console.log('[EVA content] cargado');

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

// Cargar el injector avanzado
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injector.js');
script.onload = () => {
  console.log('[EVA content] Injector cargado');
};
document.head.appendChild(script);

async function getLastResponseText() {
  // Estrategia mejorada para capturar la última respuesta de ChatGPT
  try{
    console.log('[EVA content] Buscando última respuesta...');
    
    // Estrategia 1: Buscar mensajes del asistente específicamente
    const assistantMessages = document.querySelectorAll('div[data-message-author-role="assistant"]');
    if (assistantMessages.length > 0) {
      const lastAssistant = assistantMessages[assistantMessages.length - 1];
      const text = lastAssistant.innerText?.trim();
      if (text && text.length > 10) {
        console.log('[EVA content] Respuesta encontrada por data-message-author-role');
        return text;
      }
    }

    // Estrategia 2: Buscar en el thread principal
    const threadContainer = document.querySelector('#thread, main#main');
    if (threadContainer) {
      // Buscar todos los elementos con texto sustancial
      const textElements = threadContainer.querySelectorAll('div, p, pre');
      const candidates = Array.from(textElements)
        .filter(el => {
          const text = el.innerText?.trim();
          return text &&
                 text.length > 20 &&
                 !text.match(/^(Copiar|Copy|Enviar|Send|Nuevo chat|New chat|ChatGPT|Compartir)$/i) &&
                 !el.querySelector('button, input, textarea');
        })
        .map(el => ({
          element: el,
          text: el.innerText.trim(),
          position: el.getBoundingClientRect().top
        }))
        .sort((a, b) => b.position - a.position); // Último en pantalla

      if (candidates.length > 0) {
        console.log('[EVA content] Respuesta encontrada en thread container');
        return candidates[0].text;
      }
    }

    // Estrategia 3: Buscar usando botones de copiar
    const copyBtns = Array.from(document.querySelectorAll('button')).filter(b => {
      const lab = (b.getAttribute('aria-label') || b.title || '').toLowerCase();
      return lab.includes('copy') || lab.includes('copiar');
    });
    
    if (copyBtns.length > 0) {
      console.log('[EVA content] Intentando usar botón de copiar...');
      // Ordenar por posición (último en el documento)
      copyBtns.sort((a,b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      const lastBtn = copyBtns[0];
      
      // Hacer clic y esperar
      lastBtn.click();
      await sleep(500);
      
      try {
        const clip = await navigator.clipboard.readText();
        if (clip && clip.trim() && clip.length > 10) {
          console.log('[EVA content] Respuesta obtenida del clipboard');
          return clip.trim();
        }
      } catch(e) {
        console.warn('[EVA content] Error al leer clipboard:', e);
      }
    }

    // Estrategia 4: Fallback general
    const allTextElements = document.querySelectorAll('article, div[class*="text"], div[class*="message"]');
    const textCandidates = Array.from(allTextElements)
      .filter(el => {
        const text = el.innerText?.trim();
        return text && text.length > 20 && !el.querySelector('button, input');
      })
      .sort((a,b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

    if (textCandidates.length > 0) {
      console.log('[EVA content] Respuesta encontrada con fallback general');
      return textCandidates[0].innerText.trim();
    }

    console.warn('[EVA content] No se encontró respuesta');
    return null;
    
  } catch(e) {
    console.error('[EVA content] Error en getLastResponseText:', e);
    return null;
  }
}

function findEditor(){
  // Priorizar textarea específico de ChatGPT (selector actualizado)
  const ta = document.querySelector('textarea[name="prompt-textarea"]') ||
            document.querySelector('textarea[data-virtualkeyboard="true"]') ||
            document.querySelector('textarea');
  if(ta) return ta;
  const ce = document.querySelector('[contenteditable="true"]');
  if(ce) return ce;
  return null;
}

function findSendButton(){
  // Estrategia mejorada basada en tu inspección del botón de voz
  
  // 1. Buscar botón de envío cerca del botón de voz
  const speechButton = document.querySelector('button[data-testid="composer-speech-button"]');
  if (speechButton) {
    // Buscar hermanos o botones cercanos en el mismo contenedor
    const container = speechButton.closest('.composer-parent, form, [class*="composer"]');
    if (container) {
      const buttons = container.querySelectorAll('button');
      for (const btn of buttons) {
        // Excluir botón de voz y botones de herramientas
        if (btn !== speechButton &&
            !btn.dataset.testid?.includes('speech') &&
            !btn.dataset.testid?.includes('plus') &&
            !btn.ariaLabel?.includes('voz') &&
            !btn.ariaLabel?.includes('voice') &&
            !btn.ariaLabel?.includes('Añadir') &&
            this.isElementVisible(btn)) {
          console.log('[EVA content] Botón de envío encontrado cerca del botón de voz');
          return btn;
        }
      }
    }
  }

  // 2. Selectores directos actualizados
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

  // 3. Buscar por estructura del composer
  const composerSelectors = [
    '.composer-parent button[type="submit"]',
    'form button[type="submit"]',
    '.composer-parent button:last-child',
    'form button:last-child'
  ];

  for (const selector of composerSelectors) {
    const btn = document.querySelector(selector);
    if (btn && this.isElementVisible(btn)) {
      return btn;
    }
  }

  // 4. Fallback: buscar botón con icono de envío
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const svg = btn.querySelector('svg');
    if (svg && this.isElementVisible(btn)) {
      const path = svg.querySelector('path');
      if (path) {
        const d = path.getAttribute('d');
        // Detectar iconos comunes de envío
        if (d && (
          d.includes('M9.33496 16.5V10.665H3.5') || // Icono de más
          d.includes('M12.1338') || // Icono de flecha
          d.includes('M2.6687 11.333V8.66699') // Icono de nuevo chat/enviar
        )) {
          console.log('[EVA content] Botón encontrado por icono SVG');
          return btn;
        }
      }
    }
  }

  console.warn('[EVA content] No se encontró botón de envío');
  return null;
}

/**
 * Verifica si un elemento es visible
 */
function isElementVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         element.offsetParent !== null;
}

// listener para mensajes desde popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async ()=>{
    if(msg.action === 'GET_LAST'){
      const text = await getLastResponseText();
      sendResponse({ text });
      return;
    }
    if(msg.action === 'INJECT_AND_SEND'){
      const { dest, text } = msg;
      const ed = findEditor();
      if(!ed){
        sendResponse({ ok:false, reason:'editor no encontrado' });
        return;
      }
      // inyectar texto: si textarea
      if(ed.tagName === 'TEXTAREA' || ed.tagName === 'INPUT'){
        ed.value = text;
        ed.dispatchEvent(new Event('input', { bubbles:true }));
      } else if(ed.isContentEditable){
        // insertar preservando saltos
        ed.focus();
        ed.innerText = text;
        ed.dispatchEvent(new InputEvent('input', { bubbles:true }));
      }
      // esperar un poco y click enviar
      await new Promise(r=>setTimeout(r, 150));
      const btn = findSendButton();
      if(btn){ btn.click(); sendResponse({ ok:true }); return; }
      sendResponse({ ok:false, reason:'send button not found' });
      return;
    }
    // default
    sendResponse({ ok:false, reason:'accion desconocida' });
  })();
  return true;
});
