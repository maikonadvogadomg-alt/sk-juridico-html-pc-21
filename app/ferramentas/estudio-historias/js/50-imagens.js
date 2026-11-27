/* Estúdio de Histórias — 50-imagens.js: uma imagem para cada cena (criada com IA ou escolhida por você). */
(function (H) {
  let urls = [], ocupado = false;

  function painel() {
    const k = H.imgIA.cfg();
    return '<div class="caixa"><h3>🎨 Criar imagens com IA</h3>' +
      '<label class="pequeno">Quem cria</label><select class="campo" id="ia-fonte">' +
      '<option value="pollinations"' + (k.fonte !== 'gemini' ? ' selected' : '') + '>🎨 Pollinations (grátis, sem chave)</option>' +
      '<option value="gemini"' + (k.fonte === 'gemini' ? ' selected' : '') + '>🍌 Gemini (sua chave do Gemini)</option></select>' +
      '<label class="pequeno">Jeito das imagens</label><select class="campo" id="ia-estilo">' +
      Object.keys(H.ESTILOS_VISUAIS).map((x) => '<option value="' + x + '"' + (x === k.estilo ? ' selected' : '') + '>' + H.ESTILOS_VISUAIS[x][0] + '</option>').join('') + '</select>' +
      (k.fonte === 'gemini' ? '<details><summary class="pequeno">Modelo de imagem</summary><input class="campo" id="ia-img-modelo" value="' + H.esc(k.modelo || 'gemini-2.5-flash-image') + '"></details>' : '') +
      '<div class="linha"><button class="bt forte" id="ia-faltam">🎨 Criar as imagens que faltam</button></div>' +
      '<div class="barra" id="ia-barra" hidden><i></i></div><p class="pequeno" id="ia-img-msg">Cada imagem é feita para a cena, de acordo com o caso (pessoa, lugar, emoção). Leva uns segundos por imagem.</p></div>';
  }

  async function pintar() {
    const el = H.$('#img-lista'), p = H.p; urls.forEach((u) => URL.revokeObjectURL(u)); urls = [];
    if (!p.cenas.length) { el.innerHTML = '<div class="caixa">Primeiro faça o roteiro em 📝 Caso.</div>'; return; }
    const prontas = p.cenas.filter((c) => c.imgId).length;
    let h = painel() + '<div class="caixa">🖼️ ' + prontas + ' de ' + p.cenas.length + ' cenas com imagem.</div>';
    for (let i = 0; i < p.cenas.length; i++) {
      const c = p.cenas[i]; let img = '<div class="sem-img">sem imagem · fundo escuro</div>';
      if (c.imgId) { const b = await H.banco.midia(c.imgId); if (b) { const u = URL.createObjectURL(b); urls.push(u); img = '<img class="miniatura" alt="" src="' + u + '">'; } }
      const q = encodeURIComponent(c.busca || H.limpo(c.texto).split(/\s+/).slice(0, 4).join(' '));
      h += '<div class="cena" data-i="' + i + '"><div class="cab"><b>Cena ' + (i + 1) + (c.parte ? ' · ' + H.esc(c.parte) : '') + (c.imgId ? ' ✅' : '') + '</b></div>' +
        '<div class="pequeno">' + H.esc(H.limpo(c.texto).slice(0, 140)) + (c.texto.length > 140 ? '…' : '') + '</div>' +
        (c.imagem ? '<div class="meta">💡 ' + H.esc(c.imagem) + '</div>' : '') + img +
        '<details><summary class="pequeno">✏️ O que a IA vai desenhar (pode mudar)</summary><textarea class="campo" data-f="prompt">' + H.esc(c.prompt || '') + '</textarea></details>' +
        '<div class="linha">' +
        '<button class="bt forte" data-a="criar">🎨 ' + (c.imgId ? 'Criar outra' : 'Criar') + '</button>' +
        '<button class="bt" data-a="escolher">📂</button>' +
        '<a class="bt" style="display:inline-flex;align-items:center;text-decoration:none" target="_blank" rel="noopener" href="https://www.pexels.com/pt-br/procurar/' + q + '/">🔎 Pexels</a>' +
        '<a class="bt" style="display:inline-flex;align-items:center;text-decoration:none" target="_blank" rel="noopener" href="https://pixabay.com/pt/images/search/' + q + '/">🔎 Pixabay</a>' +
        (c.imgId ? '<button class="bt" data-a="tirar">🗑</button>' : '') +
        '</div></div>';
    }
    el.innerHTML = h;
  }
  H.on('aba', (n) => { if (n === 'img') pintar(); });
  H.on('projeto', () => { if (!H.$('#aba-img').hidden) pintar(); });

  // diminui a imagem para no máximo 1920 px (economiza espaço do aparelho)
  async function reduzir(f) {
    try {
      const bmp = await createImageBitmap(f);
      const k = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
      if (k === 1 && f.size < 1.5e6) return f;
      const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      return await new Promise((ok) => cv.toBlob((b) => ok(b || f), 'image/jpeg', 0.88));
    } catch (e) { return f; }
  }
  async function porImagem(c, blob) {
    const velho = c.imgId; c.imgId = await H.banco.salvarMidia(await reduzir(blob)); await H.banco.apagarMidia(velho); await H.salvar(true);
  }

  H.imgIA.criarFaltam = async function (progresso, falhou) {
    const falta = H.p.cenas.filter((c) => !c.imgId);
    for (let k = 0; k < falta.length; k++) {
      if (progresso) progresso(k + 1, falta.length);
      try { await porImagem(falta[k], await H.imgIA.criar(falta[k])); }
      catch (e) { if (falhou) falhou(e); else throw e; }
    }
  };

  H.$('#img-lista').addEventListener('input', (e) => {
    const box = e.target.closest('.cena'); if (!box || e.target.dataset.f !== 'prompt') return;
    H.p.cenas[+box.dataset.i].prompt = e.target.value; H.salvar();
  });
  H.$('#img-lista').addEventListener('change', (e) => {
    if (e.target.id === 'ia-fonte') { H.imgIA.salvar({ fonte: e.target.value }); pintar(); }
    else if (e.target.id === 'ia-estilo') H.imgIA.salvar({ estilo: e.target.value });
    else if (e.target.id === 'ia-img-modelo') H.imgIA.salvar({ modelo: e.target.value.trim() });
  });
  H.$('#img-lista').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'ia-faltam') {
      if (ocupado) return; ocupado = true; b.disabled = true;
      const barra = H.$('#ia-barra'), msg = H.$('#ia-img-msg'); barra.hidden = false; const erros = [];
      await H.imgIA.criarFaltam((k, n) => { msg.textContent = '⏳ Criando ' + k + ' de ' + n + '…'; H.$('i', barra).style.width = Math.round((k - 1) / n * 100) + '%'; }, (er) => erros.push(er.message));
      ocupado = false;
      H.aviso(erros.length ? '⚠️ ' + erros.length + ' imagem(ns) não saíram: ' + erros[0] : '✅ Imagens prontas.', erros.length ? 'erro' : 'ok', 7000);
      pintar(); return;
    }
    if (!b.dataset.a) return;
    const i = +b.closest('.cena').dataset.i, c = H.p.cenas[i];
    if (b.dataset.a === 'criar') {
      if (ocupado) return; ocupado = true; b.disabled = true; b.textContent = '⏳ Criando…';
      try { await porImagem(c, await H.imgIA.criar(c)); H.aviso('✅ Imagem da cena ' + (i + 1) + ' pronta.', 'ok'); }
      catch (er) { H.aviso('❌ ' + er.message, 'erro', 7000); }
      ocupado = false; pintar();
    } else if (b.dataset.a === 'escolher') {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = async () => { const f = inp.files[0]; if (!f) return; await porImagem(c, f); H.aviso('✅ Imagem colocada na cena ' + (i + 1) + '.', 'ok'); pintar(); };
      inp.click();
    } else if (b.dataset.a === 'tirar') {
      if (!confirm('Tirar a imagem da cena ' + (i + 1) + '?')) return;
      await H.banco.apagarMidia(c.imgId); c.imgId = ''; await H.salvar(true); pintar();
    }
  });
})(window.H);
