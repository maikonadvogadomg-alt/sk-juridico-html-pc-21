/* Navegador SK — 00-base.js: peças comuns. */
window.N = (function () {
  const N = {};
  N.versao = '27/11-A';
  N.$ = (s, r) => (r || document).querySelector(s);
  N.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  N.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // é o APK? (Capacitor) — lá não existe bloqueio de CORS
  N.ehApk = () => !!(window.Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform());
  let tA;
  N.aviso = (m, tipo, ms) => { const e = N.$('#aviso'); e.textContent = m; e.className = 'on ' + (tipo || ''); clearTimeout(tA); tA = setTimeout(() => { e.className = ''; }, ms || 3500); };
  N.estado = (m) => { N.$('#estado').textContent = m || ''; };
  N.carregando = (s) => N.$('#progresso').classList.toggle('on', !!s);
  N.pref = {
    get(k, p) { try { const v = localStorage.getItem('navsk:' + k); return v == null ? p : JSON.parse(v); } catch (e) { return p; } },
    set(k, v) { try { localStorage.setItem('navsk:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  N.baixar = (blob, nome) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); };
  N.nomeArq = (t) => (String(t || 'pagina').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'pagina');
  // banco no aparelho (páginas guardadas)
  let dbP;
  function db() {
    return dbP || (dbP = new Promise((ok, er) => {
      const r = indexedDB.open('navegador-sk', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('paginas', { keyPath: 'url' });
      r.onsuccess = () => ok(r.result); r.onerror = () => er(r.error);
    }));
  }
  async function op(modo, f) {
    const d = await db();
    return new Promise((ok, er) => { const tx = d.transaction('paginas', modo); let res; const q = f(tx.objectStore('paginas')); if (q) q.onsuccess = () => { res = q.result; }; tx.oncomplete = () => ok(res); tx.onerror = () => er(tx.error); });
  }
  N.banco = { todas: () => op('readonly', (s) => s.getAll()), pega: (u) => op('readonly', (s) => s.get(u)), guarda: (p) => op('readwrite', (s) => s.put(p)), tira: (u) => op('readwrite', (s) => s.delete(u)) };
  const ouv = {};
  N.on = (n, f) => (ouv[n] = ouv[n] || []).push(f);
  N.emit = (n, d) => (ouv[n] || []).forEach((f) => { try { f(d); } catch (e) { console.error(e); } });
  return N;
})();
