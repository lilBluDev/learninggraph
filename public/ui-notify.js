// Simple UI notification system: toast + modal
(function(){
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
    .ui-toast-container { position: fixed; right: 1rem; bottom: 1rem; display:flex; flex-direction:column; gap:0.5rem; z-index:1100 }
    .ui-toast { background: rgba(0,0,0,0.8); color: white; padding:0.6rem 1rem; border-radius:0.5rem; min-width:200px; box-shadow:0 6px 18px rgba(0,0,0,0.2); font-size:0.95rem }
    .ui-toast.success { background: #16a34a }
    .ui-toast.error { background: #dc2626 }
    .ui-toast.info { background: #374151 }
    .ui-modal-overlay { position: fixed; inset:0; background: rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:1200 }
    .ui-modal { background:white; border-radius:0.75rem; padding:1.25rem 1.5rem; max-width:640px; width:90%; box-shadow:0 10px 30px rgba(0,0,0,0.2) }
    .ui-modal h3 { margin:0 0.5rem 0.5rem 0; font-size:1.1rem }
    .ui-modal .ui-modal-body { margin-top:0.25rem }
    .ui-modal .ui-modal-actions { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem }
    .ui-modal .btn { padding:0.5rem 0.9rem; border-radius:0.45rem; border:none; cursor:pointer }
    .ui-modal .btn.primary { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white }
    .ui-modal .btn.secondary { background:#f3f4f6 }
    `;
    document.head.appendChild(style);

    // Toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'ui-toast-container';
    document.body.appendChild(toastContainer);

    // Modal overlay (hidden initially)
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'ui-modal-overlay';
    modalOverlay.style.display = 'none';
    modalOverlay.innerHTML = `
        <div class="ui-modal" role="dialog" aria-modal="true">
            <h3 id="ui-modal-title"></h3>
            <div class="ui-modal-body" id="ui-modal-body"></div>
            <div class="ui-modal-actions" id="ui-modal-actions"></div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    function showToast(message, type='info', timeout=3500) {
        const el = document.createElement('div');
        el.className = 'ui-toast ' + (type || 'info');
        el.textContent = message;
        toastContainer.appendChild(el);
        setTimeout(() => {
            el.style.transition = 'opacity 0.25s';
            el.style.opacity = '0';
            setTimeout(()=>el.remove(), 250);
        }, timeout);
    }

    // Modal helpers
    function showModal(title, bodyHtml, buttons=[]) {
        return new Promise((resolve) => {
            modalOverlay.style.display = 'flex';
            const titleEl = document.getElementById('ui-modal-title');
            const bodyEl = document.getElementById('ui-modal-body');
            const actionsEl = document.getElementById('ui-modal-actions');
            titleEl.textContent = title || '';
            if (typeof bodyHtml === 'string') bodyEl.innerHTML = bodyHtml;
            else { bodyEl.innerHTML = ''; bodyEl.appendChild(bodyHtml); }
            actionsEl.innerHTML = '';

            // Default close on overlay click disabled to avoid accidental closings

            buttons.forEach(btn => {
                const b = document.createElement('button');
                b.className = 'btn ' + (btn.class || '');
                b.textContent = btn.text || 'OK';
                b.onclick = () => {
                    modalOverlay.style.display = 'none';
                    resolve(btn.value);
                };
                actionsEl.appendChild(b);
            });
        });
    }

    async function showAlert(message) {
        await showModal('Info', `<div>${escapeHtml(message)}</div>`, [ { text: 'OK', class: 'primary', value: true } ] );
    }

    async function showConfirm(message) {
        const res = await showModal('Konfirmasi', `<div>${escapeHtml(message)}</div>`, [
            { text: 'Batal', class: 'secondary', value: false },
            { text: 'Ya', class: 'primary', value: true }
        ]);
        return !!res;
    }

    function escapeHtml(s) {
        if (!s && s !== 0) return '';
        return String(s).replace(/[&<>'\"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;' })[c]);
    }

    // Expose API
    window.uiNotify = {
        toast: showToast,
        alert: showAlert,
        confirm: showConfirm
    };

    // Optional: replace window.alert with toast to avoid blocking expectations
    window.alert = function(msg){ showToast(String(msg)); };
    // Do NOT override confirm globally to avoid breaking sync code; use uiNotify.confirm explicitly.

})();
