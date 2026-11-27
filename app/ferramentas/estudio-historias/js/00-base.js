/* Estúdio de Histórias — 00-base.js: peças comuns (banco no aparelho, avisos, abas). */
window.H = (function () {
  const H = {};
  H.versao = '27/11-E';
  H.$ = (s, r) => (r || document).querySelector(s);
  H.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  H.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  H.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // avisos
  let tAviso;
  H.aviso = function (msg, tipo, ms) {
    const el = H.$('#aviso'); el.textContent = msg; el.className = 'on ' + (tipo || '');
    clearTimeout(tAviso); tAviso = setTimeout(() => { el.className = ''; }, ms || 3500);
  };

  // eventos simples
  const ouvintes = {};
  H.on = (n, f) => (ouvintes[n] = ouvintes[n] || []).push(f);
  H.emit = (n, d) => (ouvintes[n] || []).forEach((f) => { try { f(d); } catch (e) { console.error(e); } });

  // preferências (só neste aparelho)
  H.pref = {
    get(k, pad) { try { const v = localStorage.getItem('historias:' + k); return v == null ? pad : JSON.parse(v); } catch (e) { return pad; } },
    set(k, v) { try { localStorage.setItem('historias:' + k, JSON.stringify(v)); } catch (e) {} }
  };

  // banco no aparelho (IndexedDB): projetos + mídia (áudios e imagens)
  let dbP;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise((ok, erro) => {
      const r = indexedDB.open('estudio-historias', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('projetos')) d.createObjectStore('projetos', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('midia')) d.createObjectStore('midia');
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    });
    return dbP;
  }
  async function op(loja, modo, f) {
    const d = await db();
    return new Promise((ok, erro) => {
      const tx = d.transaction(loja, modo), st = tx.objectStore(loja); let res;
      const q = f(st); if (q) q.onsuccess = () => { res = q.result; };
      tx.oncomplete = () => ok(res); tx.onerror = () => erro(tx.error); tx.onabort = () => erro(tx.error);
    });
  }
  H.banco = {
    projetos: () => op('projetos', 'readonly', (s) => s.getAll()),
    projeto: (id) => op('projetos', 'readonly', (s) => s.get(id)),
    salvarProjeto: (p) => { p.atualizado = Date.now(); return op('projetos', 'readwrite', (s) => s.put(p)); },
    apagarProjeto: (id) => op('projetos', 'readwrite', (s) => s.delete(id)),
    midia: (id) => id ? op('midia', 'readonly', (s) => s.get(id)) : Promise.resolve(null),
    salvarMidia: async (blob) => { const id = H.uid(); await op('midia', 'readwrite', (s) => s.put(blob, id)); return id; },
    apagarMidia: (id) => id ? op('midia', 'readwrite', (s) => s.delete(id)) : Promise.resolve()
  };

  // projeto aberto
  H.p = null;
  let tSalvar;
  H.salvar = function (ja) {
    clearTimeout(tSalvar);
    const f = () => H.p && H.banco.salvarProjeto(H.p).catch((e) => H.aviso('Não consegui salvar: ' + e.message, 'erro'));
    if (ja) return f(); tSalvar = setTimeout(f, 500);
  };
  H.novoProjeto = function () {
    return { id: H.uid(), titulo: '', relato: '', plataforma: 'shorts', angulo: 'emocionante', estilo: 'historia', duracao: 'curto', formato: 'vertical', sigilo: true, roteiro: null, cenas: [], criado: Date.now(), atualizado: Date.now() };
  };
  H.novaCena = (texto, busca, imagem) => ({ id: H.uid(), parte: '', texto: texto || '', busca: busca || '', imagem: imagem || '', audioId: '', audioOrigId: '', audioTipo: '', imgId: '' });

  // abas
  H.abrirAba = function (nome) {
    H.$$('.aba').forEach((s) => { s.hidden = s.id !== 'aba-' + nome; });
    H.$$('.abas button').forEach((b) => b.classList.toggle('on', b.dataset.aba === nome));
    window.scrollTo(0, 0);
    H.emit('aba', nome);
  };

  // texto da cena → HTML do teleprompter (*ênfase*, … pausa)
  H.prompter = (t) => H.esc(t).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/(…|\.\.\.)/g, '<span class="pausa">…</span>');
  // texto limpo (sem marcas)
  H.limpo = (t) => String(t || '').replace(/\*/g, '');

  H.baixar = function (blob, nome) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  };
  H.nomeArquivo = (t) => (String(t || 'historia').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'historia');
  return H;
})();
