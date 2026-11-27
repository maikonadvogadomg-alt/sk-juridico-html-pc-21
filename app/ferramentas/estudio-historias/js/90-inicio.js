/* Estúdio de Histórias — 90-inicio.js: abre o último projeto e liga as abas. */
(function (H) {
  async function lista(selecionar) {
    const ps = (await H.banco.projetos()).sort((a, b) => b.atualizado - a.atualizado);
    const sel = H.$('#projeto');
    sel.innerHTML = ps.map((p) => '<option value="' + p.id + '">' + H.esc(p.titulo || 'Sem nome') + '</option>').join('');
    if (selecionar) sel.value = selecionar;
    return ps;
  }
  async function abrir(id) {
    const p = await H.banco.projeto(id); if (!p) return;
    H.p = p; H.pref.set('ultimo', id); H.$('#projeto').value = id;
    H.emit('projeto'); H.emit('cenas');
    const aba = (H.$$('.abas button').find((b) => b.classList.contains('on')) || {}).dataset;
    H.emit('aba', (aba && aba.aba) || 'caso');
  }
  async function novo() {
    const p = H.novoProjeto(); await H.banco.salvarProjeto(p);
    await lista(p.id); await abrir(p.id); H.abrirAba('caso');
  }
  async function iniciar() {
    let ps = await lista();
    if (!ps.length) { await novo(); return; }
    const u = H.pref.get('ultimo', ''); await abrir(ps.some((p) => p.id === u) ? u : ps[0].id);
  }
  H.$('#projeto').onchange = () => { H.salvar(true); abrir(H.$('#projeto').value); };
  H.$('#bt-novo').onclick = () => { H.salvar(true); novo(); };
  H.on('titulo', () => { const o = H.$('#projeto option[value="' + H.p.id + '"]'); if (o) o.textContent = H.p.titulo || 'Sem nome'; });
  H.on('recarregar', iniciar);
  H.$$('.abas button').forEach((b) => { b.onclick = () => H.abrirAba(b.dataset.aba); });
  window.addEventListener('pagehide', () => H.salvar(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) H.salvar(true); });
  iniciar().catch((e) => H.aviso('Erro ao abrir: ' + e.message, 'erro', 8000));
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})(window.H);
