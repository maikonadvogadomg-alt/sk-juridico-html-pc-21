/* Navegador SK — 40-pagina.js: mostra o site aqui dentro (🌐 Página) ou só o texto (📖 Leitura), com tradução. */
(function (N) {
  const quadro = N.$('#quadro'), leitura = N.$('#leitura'), vazio = N.$('#vazio');
  const pilha = [], frente = []; // histórico de voltar/avançar
  N.atual = null; // { url, html, via, titulo, texto }
  let pedido = 0;

  const ESPIAO = '<script>(function(){function ir(u,p){parent.postMessage({navsk:1,url:u,post:!!p},"*")}' +
    'document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href")||"";' +
    'if(h.charAt(0)==="#"||/^(javascript|mailto|tel):/i.test(h))return;e.preventDefault();ir(a.href)},true);' +
    'document.addEventListener("submit",function(e){var f=e.target;e.preventDefault();if((f.getAttribute("method")||"get").toLowerCase()!=="get"){ir(f.action,1);return}' +
    'var u=new URL(f.action);new FormData(f).forEach(function(v,k){if(typeof v==="string")u.searchParams.set(k,v)});ir(u.href)},true);})();<\/script>';

  function modo() { return N.pref.get('modo', 'pagina'); }
  function traduzir() { return N.$('#traduzir').checked; }

  // limpa o link do buscador (DuckDuckGo) para ir direto ao site
  function linkReal(u) {
    try { const x = new URL(u); if (/duckduckgo\.com$/.test(x.hostname) && x.pathname.startsWith('/l/') && x.searchParams.get('uddg')) return x.searchParams.get('uddg'); } catch (e) {}
    return u;
  }

  async function montarPagina(html, url, pedidoId) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('meta[http-equiv]').forEach((m) => { if (/refresh|content-security-policy/i.test(m.getAttribute('http-equiv'))) m.remove(); });
    if (!N.pref.get('scripts', false)) doc.querySelectorAll('script').forEach((s) => s.remove());
    let base = doc.querySelector('base'); if (!base) { base = doc.createElement('base'); (doc.head || doc.documentElement).prepend(base); }
    base.href = new URL(base.getAttribute('href') || url, url).href;
    if (traduzir()) {
      N.estado('🇧🇷 Traduzindo…');
      await N.traduzirDoc(doc, (k, n) => { if (pedidoId === pedido) N.estado('🇧🇷 Traduzindo ' + Math.round(k / n * 100) + '%'); });
      const t = doc.querySelector('title'); if (t) { try { t.textContent = (await N.traduzirLista([t.textContent]))[0]; } catch (e) {} }
      doc.documentElement.setAttribute('lang', 'pt-BR');
    }
    return '<!doctype html>' + doc.documentElement.outerHTML.replace(/<\/body>/i, ESPIAO + '</body>');
  }

  async function montarLeitura(html, url, pedidoId) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const r = N.lerPrincipal(doc, url);
    let titulo = r.titulo, corpo = r.html;
    if (traduzir()) {
      N.estado('🇧🇷 Traduzindo…');
      const tmp = new DOMParser().parseFromString('<body>' + corpo + '</body>', 'text/html');
      await N.traduzirDoc(tmp, (k, n) => { if (pedidoId === pedido) N.estado('🇧🇷 Traduzindo ' + Math.round(k / n * 100) + '%'); });
      corpo = tmp.body.innerHTML;
      try { titulo = (await N.traduzirLista([titulo]))[0] || titulo; } catch (e) {}
    }
    return { titulo, corpo };
  }

  async function mostrar() {
    const a = N.atual; if (!a) return;
    const meu = ++pedido; N.carregando(true);
    try {
      vazio.hidden = true;
      if (modo() === 'leitura') {
        const r = await montarLeitura(a.html, a.url, meu); if (meu !== pedido) return;
        quadro.hidden = true; leitura.hidden = false;
        leitura.innerHTML = '<h1>' + N.esc(r.titulo || a.url) + '</h1><p class="fonte">🔗 ' + N.esc(a.url) + '</p>' + r.corpo;
        leitura.scrollTop = 0;
        a.textoVisto = leitura.innerText;
      } else {
        const h = await montarPagina(a.html, a.url, meu); if (meu !== pedido) return;
        leitura.hidden = true; quadro.hidden = false;
        quadro.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups');
        quadro.removeAttribute('src'); quadro.srcdoc = h;
        a.htmlVisto = h;
      }
      N.estado('✓ ' + (a.via || '') + (traduzir() ? ' · 🇧🇷' : ''));
    } catch (e) {
      N.estado('❌ ' + e.message); N.aviso('❌ ' + e.message, 'erro', 7000);
    } finally { if (meu === pedido) N.carregando(false); }
  }
  N.mostrar = mostrar;

  N.navegar = async function (alvo, opc) {
    opc = opc || {};
    let url = linkReal(N.endereco(alvo)); if (!url) return;
    N.$('#url').value = url;
    const meu = ++pedido; N.carregando(true); N.estado('⏳ Abrindo…');
    try {
      const r = opc.pronto || await N.buscar(url);
      if (meu !== pedido) return;
      if (N.atual && !opc.semPilha) { pilha.push(N.atual.url); frente.length = 0; }
      N.atual = { url: r.final || url, html: r.html, via: r.via };
      N.$('#url').value = N.atual.url;
      N.pref.set('ultima', N.atual.url);
      N.banco.guarda({ url: '__ultima', real: N.atual.url, html: r.html, via: r.via, quando: Date.now() }).catch(() => {});
      N.emit('aberta', N.atual);
      pedido--; await mostrar();
    } catch (e) {
      if (meu === pedido) { N.carregando(false); N.estado('❌ não abriu'); N.aviso('❌ ' + e.message, 'erro', 8000); }
    }
  };
  N.voltar = () => { if (!pilha.length) return; const u = pilha.pop(); if (N.atual) frente.push(N.atual.url); N.navegar(u, { semPilha: true }); };
  N.avancar = () => { if (!frente.length) return; const u = frente.pop(); if (N.atual) pilha.push(N.atual.url); N.navegar(u, { semPilha: true }); };

  // no modo leitura, os links também abrem aqui dentro
  leitura.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a) return;
    const h = a.getAttribute('href') || ''; if (h.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(h)) return;
    e.preventDefault(); N.navegar(a.href);
  });

  window.addEventListener('message', (e) => {
    if (e.source !== quadro.contentWindow || !e.data || !e.data.navsk) return;
    if (e.data.post) { N.aviso('Esse formulário envia dados (login, consulta). Ele precisa ser aberto no Chrome: ⋮ → ↗ Abrir no Chrome.', 'erro', 7000); return; }
    N.navegar(e.data.url);
  });

  // abre o site direto no quadro (só funciona nos sites que deixam)
  N.abrirDireto = function () {
    if (!N.atual) return;
    vazio.hidden = true; leitura.hidden = true; quadro.hidden = false;
    quadro.removeAttribute('sandbox'); quadro.removeAttribute('srcdoc'); quadro.src = N.atual.url;
    N.estado('🪟 direto (se ficar em branco, o site não deixa)');
  };
})(window.N);
