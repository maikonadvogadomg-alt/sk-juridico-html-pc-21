/* Estúdio de Histórias — 30-roteiro.js: ver e mudar as cenas do roteiro. */
(function (H) {
  function pintar() {
    const el = H.$('#cenas'), p = H.p;
    if (!p.cenas.length) { el.innerHTML = '<div class="caixa">Ainda não tem roteiro. Vá em 📝 Caso, conte a história e toque em <b>🪄 Fazer o roteiro</b>.</div>'; return; }
    const topo = p.roteiro ? '<div class="caixa"><b>' + H.esc(p.roteiro.titulo) + '</b><div class="pequeno">' + H.esc(p.roteiro.descricao) + '</div></div>' : '';
    el.innerHTML = topo + p.cenas.map((c, i) =>
      '<div class="cena" data-i="' + i + '"><div class="cab"><b>Cena ' + (i + 1) + (c.parte ? ' · ' + H.esc(c.parte) : '') + '</b><div class="bts">' +
      '<button class="bt" data-a="subir" title="Subir">⬆</button><button class="bt" data-a="descer" title="Descer">⬇</button><button class="bt" data-a="tirar" title="Tirar">🗑</button></div></div>' +
      '<textarea class="campo" data-f="texto">' + H.esc(c.texto) + '</textarea>' +
      '<div class="meta">🖼️ ' + H.esc(c.imagem || '—') + '</div>' +
      '<div class="grade"><label>🎵 Clima<select class="campo" data-f="clima"><option value="">(o do ângulo)</option>' +
      Object.keys(H.CLIMAS).map((k) => '<option value="' + k + '"' + (k === c.clima ? ' selected' : '') + '>' + H.CLIMAS[k].split(' (')[0] + '</option>').join('') + '</select></label>' +
      '<label>🗣️ Tom da voz<input class="campo" data-f="tom" placeholder="ex.: voz baixa e tensa" value="' + H.esc(c.tom || '') + '"></label></div>' +
      '<input class="campo" data-f="busca" placeholder="Busca da imagem (em inglês)" value="' + H.esc(c.busca) + '"></div>').join('');
  }
  H.on('projeto', pintar); H.on('cenas', pintar);
  H.on('aba', (n) => { if (n === 'roteiro') pintar(); });

  H.$('#cenas').addEventListener('change', (e) => {
    const box = e.target.closest('.cena'); if (!box || e.target.dataset.f !== 'clima') return;
    H.p.cenas[+box.dataset.i].clima = e.target.value; H.salvar();
  });
  H.$('#cenas').addEventListener('input', (e) => {
    const box = e.target.closest('.cena'), f = e.target.dataset.f; if (!box || !f) return;
    H.p.cenas[+box.dataset.i][f] = e.target.value; H.salvar();
  });
  H.$('#cenas').addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const i = +b.closest('.cena').dataset.i, l = H.p.cenas;
    if (b.dataset.a === 'subir' && i > 0) [l[i - 1], l[i]] = [l[i], l[i - 1]];
    else if (b.dataset.a === 'descer' && i < l.length - 1) [l[i + 1], l[i]] = [l[i], l[i + 1]];
    else if (b.dataset.a === 'tirar') {
      if (!confirm('Tirar a cena ' + (i + 1) + ' do roteiro?')) return;
      const c = l.splice(i, 1)[0]; await H.banco.apagarMidia(c.audioId); await H.banco.apagarMidia(c.audioOrigId); await H.banco.apagarMidia(c.imgId);
    } else return;
    H.salvar(); pintar();
  });
  H.$('#bt-cena-nova').onclick = () => { H.p.cenas.push(H.novaCena('')); H.salvar(); pintar(); const t = H.$$('#cenas textarea'); t[t.length - 1].focus(); };

  function textoRoteiro(marcas) {
    const p = H.p;
    return (p.roteiro && p.roteiro.titulo ? p.roteiro.titulo + '\n\n' : '') +
      p.cenas.map((c, i) => 'Cena ' + (i + 1) + (c.parte ? ' (' + c.parte + ')' : '') + ':\n' + (marcas ? c.texto : H.limpo(c.texto))).join('\n\n') +
      (p.roteiro && p.roteiro.descricao ? '\n\n---\nDescrição para o YouTube:\n' + p.roteiro.descricao : '');
  }
  H.$('#bt-copiar-roteiro').onclick = async () => {
    if (!H.p.cenas.length) return;
    try { await navigator.clipboard.writeText(textoRoteiro(true)); H.aviso('📋 Roteiro copiado.', 'ok'); }
    catch (e) { H.aviso('Não consegui copiar.', 'erro'); }
  };
  H.$('#bt-baixar-roteiro').onclick = () => {
    if (!H.p.cenas.length) return;
    H.baixar(new Blob([textoRoteiro(false)], { type: 'text/plain;charset=utf-8' }), H.nomeArquivo(H.p.titulo) + '-roteiro.txt');
  };
})(window.H);
