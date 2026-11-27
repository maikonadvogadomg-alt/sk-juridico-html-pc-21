/* Navegador SK — 90-inicio.js: liga os botões e reabre a última página (sem sumir nada). */
(function (N) {
  N.$('#ir').onclick = () => N.navegar(N.$('#url').value);
  N.$('#url').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); N.$('#url').blur(); N.navegar(N.$('#url').value); } });
  N.$('#url').addEventListener('focus', () => N.$('#url').select());
  N.$('#voltar').onclick = () => N.voltar();
  N.$('#avancar').onclick = () => N.avancar();
  function pintarModo() { const m = N.pref.get('modo', 'pagina'); N.$$('.modo').forEach((b) => b.classList.toggle('on', b.dataset.modo === m)); }
  N.$$('.modo').forEach((b) => { b.onclick = () => { N.pref.set('modo', b.dataset.modo); pintarModo(); N.mostrar(); }; });
  N.$('#traduzir').checked = N.pref.get('traduzir', false);
  N.$('#traduzir').onchange = () => { N.pref.set('traduzir', N.$('#traduzir').checked); N.mostrar(); };
  N.$('#vazio-modo').textContent = N.ehApk()
    ? '📱 Você está no APK: os sites abrem direto, sem proxy.'
    : '🌐 Você está no navegador: os sites passam pela cascata de proxies grátis. Alguns não abrem; no APK abrem direto.';
  pintarModo(); N.pintarFavs();
  // reabre a última página guardada (abre na hora, sem internet)
  N.banco.pega('__ultima').then((u) => {
    if (u && u.html) N.navegar(u.real, { pronto: { html: u.html, via: (u.via || '') + ' · reaberta', final: u.real }, semPilha: true });
  }).catch(() => {});
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})(window.N);
