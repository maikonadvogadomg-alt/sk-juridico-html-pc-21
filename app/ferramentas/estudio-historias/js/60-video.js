/* Estúdio de Histórias — 60-video.js: junta voz + imagens + legenda e grava o vídeo (no próprio aparelho). */
(function (H) {
  let musica = null, montando = false, urlPronto = '';

  const palavras = (t) => H.limpo(t).split(/\s+/).filter(Boolean).length;
  const durSemVoz = (c) => Math.max(2.5, palavras(c.texto) / 2.6);

  H.on('aba', (n) => { if (n === 'video') resumo(); });
  function resumo() {
    const p = H.p, n = p.cenas.length;
    if (!n) { H.$('#video-resumo').innerHTML = 'Primeiro faça o roteiro em 📝 Caso.'; return; }
    const v = p.cenas.filter((c) => c.audioId).length, im = p.cenas.filter((c) => c.imgId).length;
    const est = Math.round(p.cenas.reduce((s, c) => s + durSemVoz(c), 0));
    H.$('#video-resumo').innerHTML = '🎬 <b>' + n + '</b> cenas · 🎙️ <b>' + v + '</b> com voz · 🖼️ <b>' + im + '</b> com imagem<br>' +
      '<span class="pequeno">Duração aproximada: ' + Math.floor(est / 60) + ' min ' + (est % 60) + ' s · formato ' + (p.formato === 'horizontal' ? 'deitado' : 'em pé') + '</span>' +
      (v < n ? '<br><span class="pequeno">⚠️ Cenas sem voz aparecem só com a legenda, em silêncio.</span>' : '');
  }

  // ---------- música de fundo ----------
  function opcoesMusica() {
    const atual = H.pref.get('musicaClima', 'auto'), sel = H.$('#musica-clima');
    sel.innerHTML = '<option value="auto">✨ Automática (segue o clima de cada parte da história)</option>' +
      Object.keys(H.CLIMAS).map((k) => '<option value="' + k + '">' + H.CLIMAS[k] + '</option>').join('') +
      '<option value="arquivo">📂 Uma música do meu aparelho</option><option value="nenhuma">🔇 Sem música</option>';
    sel.value = atual; H.$('#bt-musica').hidden = atual !== 'arquivo';
    H.$('#musica-nome').textContent = atual === 'arquivo' ? (musica ? '🎵 ' + musica.name : 'nenhuma escolhida') : atual === 'auto' ? 'clima: ' + H.CLIMAS[H.climaDoAngulo(H.p && H.p.angulo)] : '';
  }
  H.on('aba', (n) => { if (n === 'video') opcoesMusica(); });
  H.$('#musica-clima').onchange = () => { H.pref.set('musicaClima', H.$('#musica-clima').value); opcoesMusica(); };
  H.$('#bt-musica').onclick = () => H.$('#musica-arq').click();
  H.$('#musica-arq').onchange = () => { musica = H.$('#musica-arq').files[0] || null; opcoesMusica(); };
  const climaEscolhido = () => { const v = H.pref.get('musicaClima', 'auto'); return v === 'auto' ? H.climaDoAngulo(H.p.angulo) : v; };
  let tocando = null;
  H.$('#musica-ouvir').onclick = async () => {
    if (tocando) { try { tocando.close(); } catch (e) {} tocando = null; H.$('#musica-ouvir').textContent = '▶ Ouvir 10 segundos'; return; }
    const v = H.pref.get('musicaClima', 'auto'); if (v === 'nenhuma') return;
    const ac = new (window.AudioContext || window.webkitAudioContext)(); tocando = ac;
    H.$('#musica-ouvir').textContent = '⏹ Parar';
    try {
      const buf = v === 'arquivo' ? (musica ? await ac.decodeAudioData(await musica.arrayBuffer()) : null) : await H.musica.criar(climaEscolhido(), 10);
      if (!buf || tocando !== ac) return;
      const s = ac.createBufferSource(); s.buffer = buf; s.connect(ac.destination); s.start(); s.stop(ac.currentTime + 10);
      s.onended = () => { if (tocando === ac) { ac.close(); tocando = null; H.$('#musica-ouvir').textContent = '▶ Ouvir 10 segundos'; } };
    } catch (e) { H.aviso('Não consegui tocar: ' + e.message, 'erro'); }
  };

  // quebra o texto em pedaços curtos para a legenda
  function pedacosLegenda(texto) {
    const toks = String(texto || '').replace(/\s+/g, ' ').trim().split(' ');
    const out = []; let cur = [];
    toks.forEach((w) => {
      cur.push(w);
      if (cur.length >= 7 || (/[.!?…;:]$/.test(w.replace(/\*/g, '')) && cur.length >= 3)) { out.push(cur.join(' ')); cur = []; }
    });
    if (cur.length) out.push(cur.join(' '));
    return out;
  }
  // palavras com ênfase (*assim*), mesmo quando o asterisco pega várias palavras
  function tokensEnfase(trecho) {
    const r = []; let enf = false;
    trecho.split(' ').forEach((w) => {
      let a = enf;
      if (w.startsWith('*')) { a = true; enf = true; w = w.slice(1); }
      if (w.replace(/[.,!?…;:]+$/, '').endsWith('*')) { enf = false; w = w.replace(/\*([.,!?…;:]*)$/, '$1'); }
      w = w.replace(/\*/g, '');
      if (w) r.push({ w, e: a });
    });
    return r;
  }

  function desenharLegenda(g, W, H2, trecho) {
    const tam = Math.round(W * (W < H2 ? 0.066 : 0.042));
    g.font = '800 ' + tam + 'px system-ui, "Segoe UI", Roboto, sans-serif';
    g.textBaseline = 'middle'; g.lineJoin = 'round';
    const max = W * 0.86, esp = g.measureText(' ').width, linhas = [[]]; let larg = 0;
    tokensEnfase(trecho).forEach((t) => {
      const lw = g.measureText(t.w).width;
      if (larg && larg + esp + lw > max) { linhas.push([]); larg = 0; }
      linhas[linhas.length - 1].push(t); larg += (larg ? esp : 0) + lw;
    });
    const alt = tam * 1.25, y0 = H2 * (W < H2 ? 0.72 : 0.80) - ((linhas.length - 1) * alt) / 2;
    linhas.forEach((ln, k) => {
      const total = ln.reduce((s, t, j) => s + g.measureText(t.w).width + (j ? esp : 0), 0);
      let x = (W - total) / 2; const y = y0 + k * alt;
      ln.forEach((t) => {
        g.lineWidth = tam * 0.18; g.strokeStyle = 'rgba(0,0,0,.9)'; g.strokeText(t.w, x, y);
        g.fillStyle = t.e ? '#ffd24a' : '#ffffff'; g.fillText(t.w, x, y);
        x += g.measureText(t.w).width + esp;
      });
    });
  }

  function desenharImagem(g, W, H2, img, prog, i, zoom) {
    if (!img) {
      const gr = g.createLinearGradient(0, 0, W, H2);
      gr.addColorStop(0, i % 2 ? '#1b2333' : '#2a1d2e'); gr.addColorStop(1, '#0b0d12');
      g.fillStyle = gr; g.fillRect(0, 0, W, H2); return;
    }
    const k = Math.max(W / img.width, H2 / img.height) * (zoom ? 1 + 0.08 * (i % 2 ? 1 - prog : prog) : 1);
    const w = img.width * k, h = img.height * k;
    const dx = zoom ? (i % 3 - 1) * (w - W) * 0.3 * (prog - 0.5) : 0;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H2);
    g.drawImage(img, (W - w) / 2 + dx, (H2 - h) / 2, w, h);
  }

  function escurecerBaixo(g, W, H2) {
    const gr = g.createLinearGradient(0, H2 * 0.5, 0, H2);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.65)');
    g.fillStyle = gr; g.fillRect(0, H2 * 0.5, W, H2 * 0.5);
  }

  function desenharTitulo(g, W, H2, titulo, a) {
    if (!titulo) return;
    g.globalAlpha = a;
    const tam = Math.round(W * (W < H2 ? 0.075 : 0.05));
    g.font = '900 ' + tam + 'px system-ui, "Segoe UI", Roboto, sans-serif'; g.textBaseline = 'middle';
    const pal = titulo.split(/\s+/), linhas = [''];
    pal.forEach((w) => { const t = linhas[linhas.length - 1]; if (t && g.measureText(t + ' ' + w).width > W * 0.84) linhas.push(w); else linhas[linhas.length - 1] = t ? t + ' ' + w : w; });
    const y0 = H2 * 0.22 - (linhas.length - 1) * tam * 0.6;
    linhas.forEach((l, k) => {
      const x = (W - g.measureText(l).width) / 2, y = y0 + k * tam * 1.2;
      g.lineWidth = tam * 0.2; g.strokeStyle = 'rgba(0,0,0,.9)'; g.strokeText(l, x, y);
      g.fillStyle = '#ffd24a'; g.fillText(l, x, y);
    });
    g.globalAlpha = 1;
  }

  const tipoVideo = () => ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';

  H.$('#bt-montar').onclick = () => H.montarVideo().catch((e) => H.aviso('❌ ' + e.message, 'erro', 7000));
  H.montarVideo = async function () {
    const p = H.p, bt = H.$('#bt-montar');
    if (montando) return;
    if (!p.cenas.length) throw new Error('Primeiro faça o roteiro.');
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('Este navegador não grava vídeo. Use o Chrome.');
    resumo(); opcoesMusica();
    montando = true; bt.disabled = true; bt.textContent = '⏳ Preparando…';
    const pronto = H.$('#video-pronto'); pronto.innerHTML = '';
    if (urlPronto) { URL.revokeObjectURL(urlPronto); urlPronto = ''; }
    let ctx, trava, parado = false;
    try {
      const vertical = p.formato !== 'horizontal', W = vertical ? 720 : 1280, H2 = vertical ? 1280 : 720;
      const cv = H.$('#tela'); cv.width = W; cv.height = H2; cv.classList.add('on');
      const g = cv.getContext('2d');
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = ctx.createMediaStreamDestination();
      const saidaVoz = ctx.createGain(); saidaVoz.connect(dest); saidaVoz.connect(ctx.destination);

      // carrega tudo antes de começar
      const itens = [];
      for (const c of p.cenas) {
        let img = null, buf = null;
        if (c.imgId) { const b = await H.banco.midia(c.imgId); if (b) try { img = await createImageBitmap(b); } catch (e) {} }
        if (c.audioId) { const b = await H.banco.midia(c.audioId); if (b) try { buf = await ctx.decodeAudioData(await b.arrayBuffer()); } catch (e) { H.aviso('Não consegui ler o áudio de uma cena; ela vai sem voz.', 'erro'); } }
        const dur = buf ? buf.duration + 0.35 : durSemVoz(c);
        itens.push({ c, img, buf, dur, pedacos: pedacosLegenda(c.texto) });
      }
      let ini = 0.4; itens.forEach((it) => { it.ini = ini; ini += it.dur; });
      const total = ini + 0.6;

      let musBuf = null; const mv = H.pref.get('musicaClima', 'auto');
      if (mv === 'arquivo' && musica) { try { musBuf = await ctx.decodeAudioData(await musica.arrayBuffer()); } catch (e) { H.aviso('Não consegui ler a música; o vídeo vai sem ela.', 'erro'); } }
      else if (mv !== 'nenhuma' && mv !== 'arquivo') {
        bt.textContent = '🎵 Criando a música…';
        if (mv === 'auto' && itens.some((it) => it.c.clima)) {
          // muda o clima junto com a história (tensão → calma…)
          const padrao = climaEscolhido(), blocos = [];
          itens.forEach((it) => {
            const cl = it.c.clima || padrao, ult = blocos[blocos.length - 1];
            if (ult && ult.clima === cl) ult.dur = it.ini + it.dur - ult.ini; else blocos.push({ clima: cl, ini: blocos.length ? it.ini : 0, dur: it.ini + it.dur - (blocos.length ? it.ini : 0) });
          });
          blocos[blocos.length - 1].dur = total - blocos[blocos.length - 1].ini;
          // blocos muito curtos (menos de 6 s) entram no anterior, para não ficar trocando toda hora
          for (let i = blocos.length - 1; i > 0; i--) if (blocos[i].dur < 6) { blocos[i - 1].dur += blocos[i].dur; blocos.splice(i, 1); }
          musBuf = await H.musica.trilha(blocos, total);
        } else musBuf = await H.musica.criar(climaEscolhido(), total + 1);
      }

      const tipo = tipoVideo();
      const stream = new MediaStream([...cv.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const rec = new MediaRecorder(stream, Object.assign({ videoBitsPerSecond: 4500000, audioBitsPerSecond: 128000 }, tipo ? { mimeType: tipo } : {}));
      const partes = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) partes.push(e.data); };
      const acabou = new Promise((ok) => { rec.onstop = ok; });

      try { trava = await navigator.wakeLock.request('screen'); } catch (e) {}
      if (ctx.state === 'suspended') await ctx.resume();

      // desenha o primeiro quadro antes de gravar
      desenharImagem(g, W, H2, itens[0].img, 0, 0, false);
      const t0 = ctx.currentTime + 0.25;
      itens.forEach((it) => { if (it.buf) { const s = ctx.createBufferSource(); s.buffer = it.buf; s.connect(saidaVoz); s.start(t0 + it.ini); } });
      if (musBuf) {
        const s = ctx.createBufferSource(), gm = ctx.createGain(); s.buffer = musBuf; s.loop = true;
        gm.gain.setValueAtTime(0.12, t0); gm.gain.setValueAtTime(0.12, t0 + total - 1.2); gm.gain.linearRampToValueAtTime(0, t0 + total);
        s.connect(gm); gm.connect(dest); gm.connect(ctx.destination); s.start(t0); s.stop(t0 + total + 0.1);
      }
      rec.start(1000);
      const legenda = H.$('#legenda').checked, zoom = H.$('#zoom').checked, titulo = (p.roteiro && p.roteiro.titulo) || p.titulo || '';
      bt.textContent = '⏺ Gravando o vídeo… 0%';
      const aviso = () => { if (document.hidden) H.aviso('⚠️ Volte para o app: com a tela desligada o vídeo fica parado.', 'erro', 6000); };
      document.addEventListener('visibilitychange', aviso);

      await new Promise((ok) => {
        function quadro() {
          if (parado) return ok();
          const t = ctx.currentTime - t0;
          if (t >= total) { ok(); return; }
          let k = itens.findIndex((it) => t < it.ini + it.dur); if (k < 0) k = itens.length - 1;
          const it = itens[k], dentro = Math.max(0, t - it.ini), prog = Math.min(1, dentro / it.dur);
          desenharImagem(g, W, H2, it.img, prog, k, zoom);
          // transição: a próxima imagem vai aparecendo por cima nos últimos 0,6 s
          const prox = itens[k + 1], falta = it.ini + it.dur - t;
          if (prox && falta < 0.6) { g.globalAlpha = 1 - falta / 0.6; desenharImagem(g, W, H2, prox.img, 0, k + 1, zoom); g.globalAlpha = 1; }
          escurecerBaixo(g, W, H2);
          if (k === 0 && titulo) desenharTitulo(g, W, H2, titulo, Math.max(0, Math.min(1, (3.2 - t) / 0.6)));
          if (legenda && t >= it.ini) {
            const tamTotal = it.pedacos.reduce((s, x) => s + x.length, 0) || 1, uso = it.buf ? it.buf.duration : it.dur;
            let acc = 0, trecho = it.pedacos[it.pedacos.length - 1] || '';
            for (const x of it.pedacos) { acc += x.length / tamTotal * uso; if (dentro < acc) { trecho = x; break; } }
            desenharLegenda(g, W, H2, trecho);
          }
          if (k === 0 && dentro < 0.5) { g.fillStyle = 'rgba(0,0,0,' + (1 - dentro / 0.5) + ')'; g.fillRect(0, 0, W, H2); }
          if (t > total - 0.9) { g.fillStyle = 'rgba(0,0,0,' + Math.min(1, (t - (total - 0.9)) / 0.7) + ')'; g.fillRect(0, 0, W, H2); }
          bt.textContent = '⏺ Gravando o vídeo… ' + Math.round(t / total * 100) + '%';
          requestAnimationFrame(quadro);
        }
        requestAnimationFrame(quadro);
      });
      document.removeEventListener('visibilitychange', aviso);
      rec.stop(); await acabou;
      const blob = new Blob(partes, { type: (rec.mimeType || tipo || 'video/webm').split(';')[0] });
      const ext = /mp4/.test(blob.type) ? 'mp4' : 'webm', nome = H.nomeArquivo(p.titulo) + '.' + ext;
      urlPronto = URL.createObjectURL(blob);
      pronto.innerHTML = '<div class="caixa">✅ <b>Vídeo pronto</b> (' + (blob.size / 1048576).toFixed(1) + ' MB, ' + ext.toUpperCase() + ')' +
        '<video controls playsinline src="' + urlPronto + '"></video>' +
        '<div class="linha"><button class="bt forte" id="v-baixar">⬇ Baixar</button><button class="bt" id="v-partilhar">📤 Compartilhar</button></div>' +
        (ext === 'webm' ? '<p class="pequeno">O YouTube aceita WEBM normalmente.</p>' : '') + '</div>';
      H.$('#v-baixar').onclick = () => H.baixar(blob, nome);
      H.$('#v-partilhar').onclick = async () => {
        const f = new File([blob], nome, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: p.titulo || 'Vídeo' }); } catch (e) {} }
        else H.aviso('Compartilhar não funciona aqui. Use ⬇ Baixar.', 'erro');
      };
      H.aviso('✅ Vídeo pronto!', 'ok');
    } catch (e) {
      console.error(e); throw new Error('Não consegui montar o vídeo: ' + e.message);
    } finally {
      parado = true; montando = false; bt.disabled = false; bt.textContent = '🎬 Montar o vídeo';
      try { trava && trava.release(); } catch (e) {}
      try { ctx && ctx.close(); } catch (e) {}
    }
  };
})(window.H);
