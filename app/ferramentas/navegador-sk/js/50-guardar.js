/* Navegador SK — 50-guardar.js: favoritos, histórico, páginas guardadas e o menu ⋮. */
(function (N) {
  const PADRAO = [
    ['TJMG', 'https://www.tjmg.jus.br'], ['STJ', 'https://www.stj.jus.br'], ['STF', 'https://portal.stf.jus.br'],
    ['TRT-3', 'https://portal.trt3.jus.br'], ['INSS', 'https://www.gov.br/inss/pt-br'], ['Planalto (leis)', 'https://www.planalto.gov.br/ccivil_03/'],
    ['JusBrasil', 'https://www.jusbrasil.com.br'], ['Wikipédia', 'https://pt.wikipedia.org']
  ];
  const favs = () => N.pref.get('favs', PADRAO);
  function pintarFavs() {
    N.$('#favs').innerHTML = favs().map(([n, u], i) => '<button data-i="' + i + '" title="' + N.esc(u) + '">' + N.esc(n) + '</button>').join('');
  }
  N.$('#favs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) N.navegar(favs()[+b.dataset.i][1]); });
  N.$('#favs').addEventListener('contextmenu', (e) => {
    const b = e.target.closest('button'); if (!b) return; e.preventDefault();
    const l = favs(), f = l[+b.dataset.i];
    if (confirm('Tirar "' + f[0] + '" dos favoritos?')) { l.splice(+b.dataset.i, 1); N.pref.set('favs', l); pintarFavs(); }
  });

  // histórico (últimos 200)
  N.on('aberta', (a) => {
    const h = N.pref.get('historico', []).filter((x) => x.u !== a.url);
    const t = (/<title[^>]*>([^<]*)/i.exec(a.html) || [])[1] || a.url;
    h.unshift({ u: a.url, t: t.trim().slice(0, 120), q: Date.now() }); N.pref.set('historico', h.slice(0, 200));
  });

  const painel = N.$('#painel'), lista = N.$('#lista');
  N.$('#menu-bt').onclick = () => { lista.innerHTML = ''; N.$('#p-scripts').checked = N.pref.get('scripts', false); painel.hidden = false; };
  N.$('#painel-fechar').onclick = () => { painel.hidden = true; };
  painel.addEventListener('click', (e) => { if (e.target === painel) painel.hidden = true; });

  function textoAtual() {
    if (!N.atual) return '';
    if (N.atual.textoVisto && !N.$('#leitura').hidden) return N.atual.textoVisto;
    const r = N.lerPrincipal(new DOMParser().parseFromString(N.atual.htmlVisto || N.atual.html, 'text/html'), N.atual.url);
    return (r.titulo ? r.titulo + '\n\n' : '') + r.texto + '\n\nFonte: ' + N.atual.url;
  }
  const titulo = () => N.atual ? ((/<title[^>]*>([^<]*)/i.exec(N.atual.html) || [])[1] || N.atual.url).trim() : '';
  const precisa = () => { if (!N.atual) { N.aviso('Abra uma página primeiro.'); return false; } return true; };

  N.$('#p-fav').onclick = () => {
    if (!precisa()) return;
    const nome = prompt('Nome do favorito:', titulo().slice(0, 30)); if (!nome) return;
    const l = favs(); l.push([nome.trim(), N.atual.url]); N.pref.set('favs', l); pintarFavs(); N.aviso('⭐ Favorito salvo. (Para tirar, segure o dedo nele.)', 'ok');
  };
  N.$('#p-guardar').onclick = async () => {
    if (!precisa()) return;
    await N.banco.guarda({ url: N.atual.url, titulo: titulo(), html: N.atual.html, traduzida: N.$('#traduzir').checked ? (N.atual.htmlVisto || '') : '', quando: Date.now() });
    N.aviso('📌 Página guardada. Abre mesmo sem internet em 🗂️ Páginas guardadas.', 'ok', 5000);
  };
  N.$('#p-guardadas').onclick = async () => {
    const ps = (await N.banco.todas()).filter((p) => p.url !== '__ultima').sort((a, b) => b.quando - a.quando);
    lista.innerHTML = '<h3>🗂️ Páginas guardadas (' + ps.length + ')</h3>' + (ps.length ? ps.map((p) => '<div class="reg"><button class="abre" data-g="' + N.esc(p.url) + '">' + N.esc(p.titulo || p.url) + '<small>' + N.esc(p.url) + ' · ' + new Date(p.quando).toLocaleString('pt-BR') + '</small></button><button class="bt" data-tira="' + N.esc(p.url) + '">🗑</button></div>').join('') : '<p class="pequeno">Nenhuma ainda. Use 📌 Guardar.</p>');
  };
  N.$('#p-historico').onclick = () => {
    const h = N.pref.get('historico', []);
    lista.innerHTML = '<h3>🕐 Histórico</h3>' + (h.length ? h.map((x) => '<div class="reg"><button class="abre" data-u="' + N.esc(x.u) + '">' + N.esc(x.t) + '<small>' + N.esc(x.u) + '</small></button></div>').join('') + '<button class="item" id="limpar-hist">🧹 Limpar histórico</button>' : '<p class="pequeno">Vazio.</p>');
  };
  lista.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'limpar-hist') { if (confirm('Limpar o histórico?')) { N.pref.set('historico', []); lista.innerHTML = ''; } return; }
    if (b.dataset.u) { painel.hidden = true; N.navegar(b.dataset.u); }
    else if (b.dataset.g) { const p = await N.banco.pega(b.dataset.g); if (p) { painel.hidden = true; N.navegar(p.url, { pronto: { html: p.html, via: 'guardada no aparelho', final: p.url } }); } }
    else if (b.dataset.tira) { if (confirm('Apagar esta página guardada?')) { await N.banco.tira(b.dataset.tira); N.$('#p-guardadas').click(); } }
  });
  N.$('#p-baixar-txt').onclick = () => { if (precisa()) N.baixar(new Blob([textoAtual()], { type: 'text/plain;charset=utf-8' }), N.nomeArq(titulo()) + '.txt'); };
  N.$('#p-baixar-html').onclick = () => {
    if (!precisa()) return;
    const h = !N.$('#leitura').hidden ? '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + N.esc(titulo()) + '</title><body style="font:18px/1.7 system-ui;max-width:760px;margin:auto;padding:16px">' + N.$('#leitura').innerHTML + '</body>' : (N.atual.htmlVisto || N.atual.html);
    N.baixar(new Blob([h], { type: 'text/html;charset=utf-8' }), N.nomeArq(titulo()) + '.html');
  };
  N.$('#p-copiar').onclick = async () => { if (!precisa()) return; try { await navigator.clipboard.writeText(textoAtual()); N.aviso('📋 Texto copiado.', 'ok'); } catch (e) { N.aviso('Não consegui copiar.', 'erro'); } };
  N.$('#p-fora').onclick = () => { if (precisa()) window.open(N.atual.url, '_blank', 'noopener'); };
  N.$('#p-direto').onclick = () => { if (precisa()) { painel.hidden = true; N.abrirDireto(); } };
  N.$('#p-scripts').onchange = (e) => { N.pref.set('scripts', e.target.checked); if (N.atual) N.mostrar(); };

  N.pintarFavs = pintarFavs;
})(window.N);
