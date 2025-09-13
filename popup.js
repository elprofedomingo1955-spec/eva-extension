  // --- ARCHIVO popup.js
  // --- -------------------------------------

  // --- Simple storage using localStorage (append)
  const LS_KEY = 'pec_log_v1';
  const LS_COUNTER = 'pec_log_counter';

  function loadState(){
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const counter = parseInt(localStorage.getItem(LS_COUNTER) || '1', 10);
    return {arr, counter};
  }
  function saveState(arr, counter){
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
    localStorage.setItem(LS_COUNTER, ''+counter);
  }

  // --- UI refs
  const recipientEl = document.getElementById('recipient');
  const authorEl = document.getElementById('author');
  const msgIdEl = document.getElementById('msgId');
  const messageEl = document.getElementById('message');
  const lengthEl = document.getElementById('length');
  const sendBtn = document.getElementById('send');
  const repeatBtn = document.getElementById('repeat');
  const downloadBtn = document.getElementById('download');
  const clearBtn = document.getElementById('clear');
  const logEl = document.getElementById('log');
  const toggleExtra = document.getElementById('toggleExtra');
  const extraInputs = document.getElementById('extraInputs');
  const injectBtn = document.getElementById('inject');
  const statusEl = document.getElementById('status');
  const observerSelector = document.getElementById('observerSelector');

  // --- Init
  let state = loadState();
  let lastSent = null;
  updateUI();

  // --- helpers
  function fmtDate(d){
    return d.toLocaleString();
  }
  function getCheckedCategories(){
    const checked = [];
    document.querySelectorAll('.fieldset input[type=checkbox]').forEach(cb=>{
      if(cb.checked)checked.push(cb.dataset.code);
    });
    return checked.join('/');
  }

  function buildHeader(msgId){
    const recipient = recipientEl.value.trim() || 'DESTINATARIO_NO_DEFINIDO';
    const author = authorEl.value.trim() || 'AUTOR_NO_DEFINIDO';
    const now = new Date();
    const categories = getCheckedCategories();
    const extra1 = document.getElementById('extra1').value.trim();
    const extra2 = document.getElementById('extra2').value.trim();
    return `Nombre del destinatario del mensaje/canalización: ${recipient}\n\n`+
           `Mensaje (incremento +${msgId}) de ${author} hora y fecha: ${fmtDate(now)}\n`+
           `Destinatario: ${recipient}\n`+
           `${categories?('Categorias:'+categories+'\n'):''}`+
           `${toggleExtra.checked ? `Extra1:${extra1} Extra2:${extra2}\n` : ''}`+
           `^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n\n`;
  }

  function buildFooter(){
    const now = new Date();
    const author = authorEl.value.trim() || 'AUTOR_NO_DEFINIDO';
    return `\n----------------------------------------------------------------------\nFIN DEL MENSAJE [x]-----------enviado ${fmtDate(now)} por ${author}\n`;
  }

  function appendLog(entry){
    state.arr.push(entry);
    state.counter = state.counter + 1;
    saveState(state.arr, state.counter);
    lastSent = entry;
    renderLog();
  }

  function renderLog(){
    msgIdEl.textContent = (state.counter || 1);
    logEl.innerHTML = '';
    const recent = state.arr.slice(-15).reverse();
    for(const e of recent){
      const div = document.createElement('div');
      div.style.padding='6px';
      div.style.borderBottom='1px solid #f0f0f0';
      div.innerHTML = `<div class="small muted">${e.header.replace(/\n/g,'<br>')}</div><pre style="white-space:pre-wrap">${e.body}</pre><div class="muted small">${e.footer.replace(/\n/g,'<br>')}</div>`;
      logEl.appendChild(div);
    }
  }

  // --- send flow
  function sendMessage(){
    const text = messageEl.value;
    if(!text.trim()){ alert('Mensaje vacío. Escribe algo.'); return; }
    const id = state.counter || 1;
    const header = buildHeader(id);
    const footer = buildFooter();
    const entry = {id, header, body: text, footer, ts: Date.now()};
    appendLog(entry);
    statusEl.textContent = 'enviando...';

    // Try to inject into page contentEditable/textarea and click send
    tryInjectToPage(text);

    // After appending, clear textarea for next fragment
    messageEl.value = '';
    lengthEl.textContent = '0';
    statusEl.textContent = 'esperando respuesta (observer si configurado)';
  }

  // --- repeat last
  function repeatLast(){
    if(!lastSent) return alert('No hay mensaje previo para repetir');
    // re-inject body
    tryInjectToPage(lastSent.body);
  }

  // --- inject function (best-effort)
  function tryInjectToPage(text){
    // Prefer contentEditable if present
    const editable = findEditable();
    if(editable){
      // If it's a textarea
      if(editable.tagName === 'TEXTAREA'){
        const ta = editable;
        const { selectionStart, selectionEnd } = ta;
        ta.value = text;
        ta.selectionStart = ta.selectionEnd = ta.value.length;
        ta.dispatchEvent(new Event('input', {bubbles:true}));
      } else if(editable.isContentEditable){
        // set text inside
        // replace innerHTML with escaped text inside a <div>
        editable.focus();
        // for safety, try to insert plain text preserving newlines
        const lines = text.split('\n');
        editable.innerHTML = '';
        for(let i=0;i<lines.length;i++){
          const span = document.createElement('div');
          span.textContent = lines[i];
          editable.appendChild(span);
        }
        // dispatch input
        editable.dispatchEvent(new InputEvent('input', {bubbles:true}));
      }

      // find send button dynamically
      const sendBtn = findSendButton();
      if(sendBtn){
        // small delay to let React reconcile
        setTimeout(()=>{
          try{ sendBtn.click(); statusEl.textContent='mensaje enviado (click)'; }catch(e){ console.warn(e); statusEl.textContent='error click'; }
        }, 120);
      } else {
        // fallback: copy to clipboard and inform user
        navigator.clipboard.writeText(text).then(()=>{
          alert('Texto copiado al portapapeles. Pega manualmente en el editor y envía.');
          statusEl.textContent='copiado al portapapeles (fallback)';
        }).catch(()=>{
          alert('No se pudo inyectar ni copiar. No hay editor detectable.');
        });
      }
    } else {
      alert('No se detectó editor en la página. Puedes pegar manualmente.');
    }
  }

  function findEditable(){
    // heurísticos: contentEditable div, or visible textarea
    const ta = document.querySelector('textarea:not([style*="display: none"]), textarea:not([hidden])');
    if(ta && ta.offsetParent !== null) return ta;
    const editable = document.querySelector('[contenteditable="true"]');
    if(editable) return editable;
    // try more generic
    const ed2 = Array.from(document.querySelectorAll('[contenteditable]')).find(e=>e.getAttribute('contenteditable')!=='false');
    if(ed2) return ed2;
    return null;
  }

  function findSendButton(){
    // try common selectors; best-effort
    return document.querySelector('#composer-submit-button') || document.querySelector('button[data-testid="send-button"]') || document.querySelector('button[aria-label*="Enviar"], button[aria-label*="Send"]');
  }

  // --- download log
  function downloadLog(){
    const content = state.arr.map(e=>e.header+e.body+e.footer).join('\n\n-----\n\n');
    const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bitacora_${(new Date()).toISOString().replace(/[:.]/g,'-')}.txt`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // --- new bitacora
  function clearLog(){
    if(!confirm('Crear nueva bitácora y borrar la actual?')) return;
    state.arr = [];
    state.counter = 1;
    saveState(state.arr, state.counter);
    renderLog();
  }

  // --- toggle extra inputs
  toggleExtra.addEventListener('change', ()=>{
    extraInputs.style.display = toggleExtra.checked ? 'block' : 'none';
  });

  messageEl.addEventListener('input', ()=>{
    lengthEl.textContent = messageEl.value.length;
  }, {passive:true});

  // --- first char time capture
  let firstCharCaptured = false;
  messageEl.addEventListener('keydown', (e)=>{
    if(!firstCharCaptured && e.key.length===1){
      // first printable char pressed
      firstCharCaptured = true;
      const now = new Date();
      // prepend header visually in a small note (not in textarea)
      console.log('Primer caracter detectado a las', now.toLocaleString());
      statusEl.textContent = 'primer caracter: '+now.toLocaleString();
    }
  });

  // attach controls
  sendBtn.addEventListener('click', sendMessage);
  repeatBtn.addEventListener('click', repeatLast);
  downloadBtn.addEventListener('click', downloadLog);
  clearBtn.addEventListener('click', clearLog);

  injectBtn.addEventListener('click', ()=>{
    const text = messageEl.value || (lastSent && lastSent.body) || '';
    if(!text) return alert('Nada para inyectar');
    tryInjectToPage(text);
  });

  // --- observer optional watch on target selector
  let observer = null;
  document.getElementById('observerSelector').addEventListener('change', ()=>{
    const sel = observerSelector.value.trim();
    if(observer){ observer.disconnect(); observer = null; statusEl.textContent='observer detenido'; }
    if(sel){
      const el = document.querySelector(sel);
      if(!el) return alert('Selector no encontrado en esta página');
      observer = new MutationObserver((muts)=>{
        statusEl.textContent = 'Cambio detectado en target: '+new Date().toLocaleTimeString();
        // Cuando cambia el DOM, habilitar botón de envío del popup
        sendBtn.disabled = false;
      });
      observer.observe(el, {childList:true, subtree:true, characterData:true});
      statusEl.textContent='observer activo en '+sel;
    }
  });

  // --- init state
  (function init(){
    if(!state.arr) state.arr = [];
    if(!state.counter) state.counter = 1;
    renderLog();
  })();
