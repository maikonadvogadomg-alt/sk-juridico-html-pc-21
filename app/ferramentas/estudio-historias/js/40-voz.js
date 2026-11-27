/* Estúdio de Histórias — 40-voz.js: quem narra cada cena.
   🎙️ a sua voz (gravada no teleprompter e melhorada sozinha) · 🤖 voz da IA (Gemini) · 💻 vozes da Microsoft · 📂 áudio pronto. */
(function (H) {
  let urls = [], gravador = null, gravandoI = -1, fluxo = null, pedacos = [], ocupado = false;
  const limparUrls = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls = []; };
  const modo = () => H.pref.get('narrador', 'minha');
  const receita = () => H.pref.get('receitaVoz', 'locutor');
  const autoMelhorar = () => H.pref.get('autoMelhorar', true);
  const TIPOS = { gravada: '🎙️ sua voz (crua)', melhorada: '✨ sua voz melhorada', ia: '🤖 voz da IA', arquivo: '📂 áudio trazido' };

  // ---------- troca de áudio da cena (sempre apaga o que ficou sem uso) ----------
  async function porAudio(c, blob, tipo) {
    const velho = c.audioId, velhoOrig = c.audioOrigId;
    c.audioId = await H.banco.salvarMidia(blob); c.audioTipo = tipo; c.audioOrigId = '';
    await H.banco.apagarMidia(velho); await H.banco.apagarMidia(velhoOrig);
    await H.salvar(true);
  }
  async function melhorarCena(c) {
    const base = c.audioOrigId || c.audioId; if (!base) return;
    const blob = await H.banco.midia(base); if (!blob) return;
    const novo = await H.som.melhorar(blob, receita());
    if (c.audioOrigId) await H.banco.apagarMidia(c.audioId); else c.audioOrigId = c.audioId;
    c.audioId = await H.banco.salvarMidia(novo); c.audioTipo = 'melhorada';
    await H.salvar(true);
  }
  async function voltarOriginal(c) {
    if (!c.audioOrigId) return;
    await H.banco.apagarMidia(c.audioId); c.audioId = c.audioOrigId; c.audioOrigId = ''; c.audioTipo = 'gravada';
    await H.salvar(true);
  }

  // ---------- painel de cima: quem narra ----------
  function painel() {
    const m = modo(), v = H.vozIA.cfg();
    let h = '<div class="caixa"><h3>Quem narra?</h3><select class="campo" id="narrador">' +
      '<option value="minha"' + (m === 'minha' ? ' selected' : '') + '>🎙️ Minha voz (gravo e o app melhora)</option>' +
      '<option value="gemini"' + (m === 'gemini' ? ' selected' : '') + '>🤖 Voz da IA do Google (Gemini)</option>' +
      '<option value="microsoft"' + (m === 'microsoft' ? ' selected' : '') + '>🗣️ Francisco e vozes da Microsoft (grátis, pelo PC ou Termux)</option></select>';
    if (m === 'minha') {
      h += '<label class="pequeno">Como deixar a voz</label><select class="campo" id="receita">' +
        Object.keys(H.PRESETS).map((k) => '<option value="' + k + '"' + (k === receita() ? ' selected' : '') + '>' + H.PRESETS[k].nome + '</option>').join('') + '</select>' +
        '<label class="marcar"><input type="checkbox" id="auto-melhorar"' + (autoMelhorar() ? ' checked' : '') + '> ✨ Melhorar sozinho logo depois de gravar</label>' +
        '<div class="linha"><button class="bt forte" id="tp-abrir">🎬 Gravar no teleprompter (todas seguidas)</button><button class="bt" id="melhorar-todas">✨ Melhorar todas as gravadas</button></div>' +
        '<p class="pequeno">O app tira o chiado do fundo, corta o silêncio das pontas, deixa a voz mais encorpada e clara e acerta o volume. Dica: grave perto do celular, num cômodo com cortina ou roupas (o som fica menos "seco"), sem ventilador ligado. Antes de cada gravação, fique 1 segundo em silêncio: o app usa esse trecho para aprender o ruído.</p>';
    } else if (m === 'gemini') {
      h += '<label class="pequeno">Voz</label><select class="campo" id="g-voz">' +
        H.VOZES_GEMINI.map(([n, d]) => '<option value="' + n + '"' + (n === v.voz ? ' selected' : '') + '>' + n + ' — ' + d + '</option>').join('') + '</select>' +
        '<label class="pequeno">Jeito de narrar (vem do ângulo do roteiro; pode mudar)</label><textarea class="campo" id="g-estilo" placeholder="' + H.esc(H.ESTILO_ANGULO[H.p.angulo || 'emocionante']) + '">' + H.esc(v.estilo || '') + '</textarea>' +
        (H.ia.config().prov === 'gemini' && H.ia.config().chave ? '<p class="pequeno">🔑 Usando a chave do Gemini de ⚙️ Config.</p>' : '<input class="campo" id="g-chave" type="password" placeholder="Chave do Gemini (fica só neste aparelho)" value="' + H.esc(v.chave || '') + '">') +
        '<details><summary class="pequeno">Modelo de voz</summary><input class="campo" id="g-modelo" value="' + H.esc(v.modelo || 'gemini-3.8-flash-tts') + '"></details>' +
        '<div class="linha"><button class="bt" id="g-amostra">▶ Ouvir amostra</button><button class="bt forte" id="g-todas">🤖 Gerar as cenas que faltam</button></div>' +
        '<div class="barra" id="g-barra" hidden><i></i></div><p class="pequeno" id="g-msg">Usa a sua chave do Gemini. Se a cota grátis acabar, o app avisa e as cenas prontas ficam guardadas.</p>';
    } else {
      const ms = H.pref.get('vozMS', { voz: 'pt-BR-FranciscoNeural', vel: '+0%', tom: '+0Hz' });
      h += '<label class="pequeno">Voz</label><select class="campo" id="ms-voz">' + H.VOZES_MS.map(([n, d]) => '<option value="' + n + '"' + (n === ms.voz ? ' selected' : '') + '>' + d + '</option>').join('') + '</select>' +
        '<div class="grade"><label>Velocidade<select class="campo" id="ms-vel">' + ['-15%', '-8%', '+0%', '+8%', '+15%'].map((x) => '<option' + (x === ms.vel ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label>' +
        '<label>Tom<select class="campo" id="ms-tom">' + ['-6Hz', '-3Hz', '+0Hz', '+3Hz'].map((x) => '<option' + (x === ms.tom ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label></div>' +
        '<ol class="pequeno"><li>Toque em <b>⬇ Baixar o programa das vozes</b>.</li><li>Rode no PC (<code>pip install edge-tts</code> e depois <code>python nome-do-arquivo.py</code>) ou no Termux. As instruções estão escritas no começo do arquivo.</li><li>Ele cria a pasta <b>vozes-…</b> com cena-01.mp3, cena-02.mp3…</li><li>Toque em <b>📂 Trazer as vozes</b> e escolha todos os arquivos: cada um vai para a sua cena pelo número.</li></ol>' +
        '<div class="linha"><button class="bt" id="ms-baixar">⬇ Baixar o programa das vozes</button><button class="bt" id="ms-trazer">📂 Trazer as vozes (todas de uma vez)</button></div>' +
        '<div class="caixa"><h3>🔌 Voz automática (sem trazer arquivo)</h3><p class="pequeno">No <b>programa do PC</b> (Estúdio para PC, Meu Chat ou Mini SK) a voz Francisco já vem ligada: é só tocar em 💻 Gerar. No celular: deixe aberto o <b>voz-francisco.py</b> ou a <b>ponte-voz.py</b> no Termux.</p>' +
        '<div class="linha"><button class="bt" id="ms-ponte-baixar">⬇ Baixar a ponte (ponte-voz.py)</button><button class="bt" id="ms-ponte-testar">🔌 Ver se está ligada</button></div>' +
        '<button class="bt forte largo" id="ms-ponte-gerar">💻 Gerar as cenas que faltam pela ponte</button><p class="pequeno" id="ms-ponte-msg"></p></div>';
    }
    return h + '</div>';
  }

  async function pintar() {
    const el = H.$('#voz-lista'), p = H.p; limparUrls();
    if (!p.cenas.length) { el.innerHTML = '<div class="caixa">Primeiro faça o roteiro em 📝 Caso.</div>'; return; }
    const m = modo(), prontas = p.cenas.filter((c) => c.audioId).length;
    let h = painel() + '<div class="caixa">🎙️ ' + prontas + ' de ' + p.cenas.length + ' cenas com voz.</div>';
    for (let i = 0; i < p.cenas.length; i++) {
      const c = p.cenas[i]; let au = '';
      if (c.audioId) { const b = await H.banco.midia(c.audioId); if (b) { const u = URL.createObjectURL(b); urls.push(u); au = '<audio controls preload="metadata" src="' + u + '"></audio><div class="meta">' + (TIPOS[c.audioTipo] || TIPOS.arquivo) + '</div>'; } }
      const minhaVoz = c.audioTipo === 'gravada' || c.audioTipo === 'melhorada';
      h += '<div class="cena" data-i="' + i + '"><div class="cab"><b>Cena ' + (i + 1) + (c.parte ? ' · ' + H.esc(c.parte) : '') + (c.audioId ? ' ✅' : '') + '</b></div>' +
        '<div class="prompter">' + H.prompter(c.texto) + '</div>' + au + '<div class="linha">' +
        (m === 'minha' ? '<button class="bt forte" data-a="gravar">' + (gravandoI === i ? '⏹ Parar' : (c.audioId ? '⏺ Gravar de novo' : '⏺ Gravar')) + '</button>' : '') +
        (m === 'gemini' ? '<button class="bt forte" data-a="gerar">🤖 ' + (c.audioId ? 'Gerar de novo' : 'Gerar') + '</button>' : '') +
        (minhaVoz ? '<button class="bt" data-a="melhorar">✨ Melhorar</button>' : '') +
        (c.audioOrigId ? '<button class="bt" data-a="original">↩ Original</button>' : '') +
        '<button class="bt" data-a="importar" title="Trazer áudio pronto">📂</button>' +
        '<button class="bt" data-a="previa" title="Ouvir com a voz do aparelho, só para ensaiar">🔊 Ensaiar</button>' +
        (c.audioId ? '<button class="bt" data-a="tirar">🗑</button>' : '') + '</div></div>';
    }
    el.innerHTML = h;
    if (gravandoI >= 0) { const b = H.$('.cena[data-i="' + gravandoI + '"] [data-a="gravar"]', el); if (b) b.classList.add('gravando'); }
  }
  H.on('aba', (n) => { if (n === 'voz') pintar(); else { pararFluxo(); if (window.speechSynthesis) speechSynthesis.cancel(); } });
  H.on('projeto', () => { if (!H.$('#aba-voz').hidden) pintar(); });

  // ---------- gravar a sua voz ----------
  function pararFluxo() {
    if (gravador && gravador.state === 'recording') gravador.stop();
    if (fluxo) { fluxo.getTracks().forEach((t) => t.stop()); fluxo = null; }
  }
  const tipoAudio = () => ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
  async function gravar(i) {
    if (gravandoI === i) { gravador.stop(); return; }
    if (gravandoI >= 0) { H.aviso('Termine a gravação da cena ' + (gravandoI + 1) + ' primeiro.', 'erro'); return; }
    if (!window.MediaRecorder) { H.aviso('Este navegador não grava áudio. Use o Chrome.', 'erro'); return; }
    try {
      // sem o "filtro de ligação" do celular: o app limpa melhor depois
      if (!fluxo) fluxo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true, channelCount: 1 } });
    } catch (e) { H.aviso('O microfone foi bloqueado. Libere o microfone para este app.', 'erro', 6000); return; }
    const tipo = tipoAudio(); pedacos = [];
    gravador = new MediaRecorder(fluxo, Object.assign({ audioBitsPerSecond: 128000 }, tipo ? { mimeType: tipo } : {}));
    gravador.ondataavailable = (e) => { if (e.data && e.data.size) pedacos.push(e.data); };
    gravador.onstop = async () => {
      const c = H.p.cenas[gravandoI], n = gravandoI; gravandoI = -1;
      const blob = new Blob(pedacos, { type: gravador.mimeType || tipo || 'audio/webm' });
      if (blob.size < 2000) { H.aviso('A gravação ficou vazia. Tente de novo.', 'erro'); pintar(); return; }
      await porAudio(c, blob, 'gravada');
      if (autoMelhorar()) {
        H.aviso('✨ Melhorando a voz da cena ' + (n + 1) + '…', '', 8000);
        try { await melhorarCena(c); H.aviso('✅ Voz da cena ' + (n + 1) + ' guardada e melhorada.', 'ok'); }
        catch (e) { H.aviso('Guardei a gravação, mas não consegui melhorar: ' + e.message, 'erro', 6000); }
      } else H.aviso('✅ Voz da cena guardada.', 'ok');
      pintar();
    };
    gravador.start(); gravandoI = i; pintar();
  }

  function escolherArquivos(multi) {
    return new Promise((ok) => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = !!multi;
      inp.accept = 'audio/*,.mp3,.wav,.m4a,.ogg,.opus,.webm';
      inp.onchange = () => ok(Array.from(inp.files || [])); inp.click();
    });
  }

  // ---------- ensaio com a voz do aparelho ----------
  function vozBoa() {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const pt = vs.filter((v) => /^pt[-_]BR/i.test(v.lang));
    return pt.find((v) => /pt-br-x-pte/i.test(v.name + v.voiceURI)) || pt.find((v) => /natural|online|francisco|antonio/i.test(v.name)) || pt.find((v) => !/compact/i.test(v.name)) || pt[0] || null;
  }
  function previa(i) {
    if (!window.speechSynthesis) { H.aviso('Sem voz do aparelho neste navegador.', 'erro'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(H.limpo(H.p.cenas[i].texto).replace(/…/g, '... '));
    u.lang = 'pt-BR'; const v = vozBoa(); if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  if (window.speechSynthesis) speechSynthesis.getVoices();

  // ---------- Gemini ----------
  function lerGemini() {
    const c = {};
    if (H.$('#g-voz')) c.voz = H.$('#g-voz').value;
    if (H.$('#g-estilo')) c.estilo = H.$('#g-estilo').value.trim();
    if (H.$('#g-modelo')) c.modelo = H.$('#g-modelo').value.trim() || 'gemini-3.8-flash-tts';
    if (H.$('#g-chave')) c.chave = H.$('#g-chave').value.trim();
    H.vozIA.salvar(c);
  }
  async function gerarCena(i) {
    const c = H.p.cenas[i];
    const blob = await H.vozIA.falar(c.texto, null, c.tom);
    await porAudio(c, blob, 'ia');
  }
  async function gerarTodas() {
    if (ocupado) return; ocupado = true; lerGemini();
    const falta = H.p.cenas.map((c, i) => (c.audioId ? -1 : i)).filter((i) => i >= 0);
    if (!falta.length) { H.aviso('Todas as cenas já têm voz. Para refazer uma, toque em 🤖 Gerar de novo nela.'); ocupado = false; return; }
    const barra = H.$('#g-barra'), msg = H.$('#g-msg'); barra.hidden = false;
    try {
      for (let k = 0; k < falta.length; k++) {
        msg.textContent = '⏳ Cena ' + (falta[k] + 1) + ' (' + (k + 1) + ' de ' + falta.length + ')…';
        H.$('i', barra).style.width = Math.round(k / falta.length * 100) + '%';
        await gerarCena(falta[k]);
      }
      H.aviso('✅ Vozes prontas.', 'ok');
    } catch (e) { H.aviso('❌ ' + e.message, 'erro', 8000); }
    finally { ocupado = false; pintar(); }
  }

  H.vozIA.porAudioCena = (c, blob) => porAudio(c, blob, 'ia');
  H.vozIA.gerarFaltam = async function (progresso) {
    const falta = H.p.cenas.map((c, i) => (c.audioId ? -1 : i)).filter((i) => i >= 0);
    for (let k = 0; k < falta.length; k++) { if (progresso) progresso(k + 1, falta.length); await gerarCena(falta[k]); }
  };

  // ---------- 🎬 teleprompter de tela cheia: o texto sobe sozinho, mostra como falar e grava cena por cena ----------
  const TP = { i: 0, rec: null, partes: [], anim: 0, fila: Promise.resolve(), cancelado: false };
  function tpTela() {
    let el = H.$('#tp'); if (el) return el;
    el = document.createElement('div'); el.id = 'tp';
    el.innerHTML = '<div class="tp-cab"><b id="tp-num"></b><button class="bt" id="tp-fechar">✖ Sair</button></div>' +
      '<div class="tp-janela"><div class="tp-texto" id="tp-texto"></div></div>' +
      '<div class="tp-como" id="tp-como"></div><div class="tp-conta" id="tp-conta"></div>' +
      '<div class="tp-bts"><button class="bt forte" id="tp-ir">⏺ Começar</button><button class="bt" id="tp-repetir" hidden>🔁 Repetir esta</button><button class="bt forte" id="tp-prox" hidden>✅ Próxima</button></div>' +
      '<div class="tp-vel pequeno">Velocidade do texto <input type="range" id="tp-vel" min="1.6" max="3.6" step="0.1"> <span id="tp-vel-n"></span></div>';
    document.body.appendChild(el);
    const v = H.$('#tp-vel'); v.value = H.pref.get('tpVel', 2.5); H.$('#tp-vel-n').textContent = v.value + ' palavras/s';
    v.oninput = () => { H.pref.set('tpVel', +v.value); H.$('#tp-vel-n').textContent = v.value + ' palavras/s'; };
    H.$('#tp-fechar').onclick = () => tpFechar();
    H.$('#tp-ir').onclick = () => tpGravar();
    H.$('#tp-repetir').onclick = () => tpParar(false).then(tpGravar);
    H.$('#tp-prox').onclick = () => tpParar(true).then(() => { if (TP.i < H.p.cenas.length - 1) { TP.i++; tpMostrar(); tpGravar(); } else tpFim(); });
    return el;
  }
  function tpMostrar() {
    const c = H.p.cenas[TP.i], n = H.p.cenas.length;
    H.$('#tp-num').textContent = 'Cena ' + (TP.i + 1) + ' de ' + n + (c.parte ? ' · ' + c.parte : '') + (c.audioId ? ' (já tem voz: vai trocar)' : '');
    H.$('#tp-texto').innerHTML = H.prompter(c.texto); H.$('#tp-texto').style.transform = 'translateY(0)';
    H.$('#tp-como').innerHTML = '🗣️ <b>Como falar:</b> ' + H.esc(c.tom || H.ESTILO_ANGULO[H.p.angulo || 'emocionante']) + '<br><span class="pequeno">Palavras em amarelo = mais força · azul … = pausa</span>';
    H.$('#tp-ir').hidden = false; H.$('#tp-repetir').hidden = true; H.$('#tp-prox').hidden = true; H.$('#tp-conta').textContent = '';
  }
  async function tpAbrir() {
    if (!window.MediaRecorder) { H.aviso('Este navegador não grava áudio. Use o Chrome.', 'erro'); return; }
    try { if (!fluxo) fluxo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true, channelCount: 1 } }); }
    catch (e) { H.aviso('O microfone foi bloqueado. Libere o microfone para este app.', 'erro', 6000); return; }
    tpTela().classList.add('on'); TP.cancelado = false;
    const prim = H.p.cenas.findIndex((c) => !c.audioId); TP.i = prim >= 0 ? prim : 0; tpMostrar();
    try { await navigator.wakeLock.request('screen'); } catch (e) {}
  }
  async function tpGravar() {
    H.$('#tp-ir').hidden = true; H.$('#tp-repetir').hidden = true; H.$('#tp-prox').hidden = true;
    for (const k of [3, 2, 1]) { if (TP.cancelado) return; H.$('#tp-conta').textContent = k; await new Promise((ok) => setTimeout(ok, 700)); }
    H.$('#tp-conta').textContent = '● gravando'; if (TP.cancelado) return;
    const tipo = tipoAudio(); TP.partes = [];
    TP.rec = new MediaRecorder(fluxo, Object.assign({ audioBitsPerSecond: 128000 }, tipo ? { mimeType: tipo } : {}));
    TP.rec.ondataavailable = (e) => { if (e.data && e.data.size) TP.partes.push(e.data); };
    TP.rec.start();
    // o texto sobe na velocidade da fala (depois de 1 s, para dar tempo de começar)
    const caixa = H.$('#tp-texto'), jan = caixa.parentElement, c = H.p.cenas[TP.i];
    const seg = Math.max(2, H.limpo(c.texto).split(/\s+/).length / (+H.pref.get('tpVel', 2.5))), sobe = Math.max(0, caixa.scrollHeight - jan.clientHeight * 0.45);
    const t0 = performance.now() + 1000; cancelAnimationFrame(TP.anim);
    const passo = () => { const f = Math.min(1, Math.max(0, (performance.now() - t0) / (seg * 1000))); caixa.style.transform = 'translateY(' + (-sobe * f) + 'px)'; if (f < 1 && TP.rec && TP.rec.state === 'recording') TP.anim = requestAnimationFrame(passo); };
    TP.anim = requestAnimationFrame(passo);
    H.$('#tp-repetir').hidden = false; H.$('#tp-prox').hidden = false;
    H.$('#tp-prox').textContent = TP.i < H.p.cenas.length - 1 ? '✅ Próxima' : '✅ Terminar';
  }
  function tpParar(guardar) {
    return new Promise((ok) => {
      cancelAnimationFrame(TP.anim);
      if (!TP.rec || TP.rec.state !== 'recording') return ok();
      const c = H.p.cenas[TP.i], rec = TP.rec;
      rec.onstop = () => {
        TP.rec = null;
        if (guardar) {
          const blob = new Blob(TP.partes, { type: rec.mimeType || 'audio/webm' });
          // guarda e melhora em segundo plano, enquanto você grava a próxima
          TP.fila = TP.fila.then(async () => {
            if (blob.size < 2000) return;
            await porAudio(c, blob, 'gravada');
            if (autoMelhorar()) { try { await melhorarCena(c); } catch (e) {} }
          });
        }
        ok();
      };
      rec.stop();
    });
  }
  async function tpFim() {
    H.$('#tp-num').textContent = '🎉 Todas as cenas gravadas!';
    H.$('#tp-texto').innerHTML = '⏳ Terminando de melhorar as vozes…'; H.$('#tp-texto').style.transform = 'translateY(0)';
    H.$('#tp-como').textContent = ''; H.$('#tp-conta').textContent = '';
    ['tp-ir', 'tp-repetir', 'tp-prox'].forEach((x) => { H.$('#' + x).hidden = true; });
    await TP.fila; H.$('#tp-texto').innerHTML = '✅ Pronto. Toque em ✖ Sair para ouvir cada cena.';
  }
  async function tpFechar() {
    TP.cancelado = true; await tpParar(false); await TP.fila;
    const el = H.$('#tp'); if (el) el.classList.remove('on'); pintar();
  }

  // ---------- cliques ----------
  H.$('#voz-lista').addEventListener('change', (e) => {
    const id = e.target.id;
    if (id === 'narrador') { H.pref.set('narrador', e.target.value); pararFluxo(); pintar(); }
    else if (id === 'receita') H.pref.set('receitaVoz', e.target.value);
    else if (id === 'auto-melhorar') H.pref.set('autoMelhorar', e.target.checked);
    else if (/^g-/.test(id)) lerGemini();
    else if (/^ms-/.test(id)) H.pref.set('vozMS', { voz: H.$('#ms-voz').value, vel: H.$('#ms-vel').value, tom: H.$('#ms-tom').value });
  });
  H.$('#voz-lista').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.id;
    if (id === 'melhorar-todas') {
      const l = H.p.cenas.filter((c) => c.audioTipo === 'gravada' || c.audioTipo === 'melhorada');
      if (!l.length) { H.aviso('Nenhuma cena gravada com a sua voz ainda.'); return; }
      b.disabled = true;
      try { for (let k = 0; k < l.length; k++) { b.textContent = '✨ ' + (k + 1) + ' de ' + l.length + '…'; await melhorarCena(l[k]); } H.aviso('✅ Todas melhoradas.', 'ok'); }
      catch (er) { H.aviso('❌ ' + er.message, 'erro', 6000); }
      pintar(); return;
    }
    if (id === 'tp-abrir') return tpAbrir();
    if (id === 'g-amostra') {
      lerGemini(); b.disabled = true; b.textContent = '⏳…';
      try { const bl = await H.vozIA.falar('Olá! Esta é a minha voz. Vou contar uma história que aconteceu de verdade… e o final vai te surpreender.'); new Audio(URL.createObjectURL(bl)).play(); }
      catch (er) { H.aviso('❌ ' + er.message, 'erro', 8000); }
      b.disabled = false; b.textContent = '▶ Ouvir amostra'; return;
    }
    if (id === 'g-todas') return gerarTodas();
    if (id === 'ms-baixar') {
      const ms = { voz: H.$('#ms-voz').value, vel: H.$('#ms-vel').value, tom: H.$('#ms-tom').value }; H.pref.set('vozMS', ms);
      H.baixar(new Blob([H.vozIA.programaMS(ms.voz, ms.vel, ms.tom)], { type: 'text/x-python;charset=utf-8' }), H.nomeArquivo(H.p.titulo) + '-vozes.py');
      return;
    }
    if (id === 'ms-ponte-baixar') { H.baixar(new Blob([H.vozIA.programaPonte()], { type: 'text/x-python;charset=utf-8' }), 'ponte-voz.py'); return; }
    if (id === 'ms-ponte-testar') { H.$('#ms-ponte-msg').textContent = (await H.vozIA.ponte.ligada()) ? '✅ A ponte está ligada.' : '❌ Não achei a ponte. Abra o ponte-voz.py neste aparelho.'; return; }
    if (id === 'ms-ponte-gerar') {
      if (ocupado) return; const msg = H.$('#ms-ponte-msg');
      if (!(await H.vozIA.ponte.ligada())) { msg.textContent = '❌ Não achei a ponte. Abra o ponte-voz.py neste aparelho e tente de novo.'; return; }
      const ms = { voz: H.$('#ms-voz').value, vel: H.$('#ms-vel').value, tom: H.$('#ms-tom').value }; H.pref.set('vozMS', ms);
      const falta = H.p.cenas.map((c, i) => (c.audioId ? -1 : i)).filter((i) => i >= 0);
      if (!falta.length) { msg.textContent = 'Todas as cenas já têm voz.'; return; }
      ocupado = true; b.disabled = true;
      try { for (let k = 0; k < falta.length; k++) { msg.textContent = '⏳ Cena ' + (falta[k] + 1) + ' (' + (k + 1) + ' de ' + falta.length + ')…'; await porAudio(H.p.cenas[falta[k]], await H.vozIA.ponte.falar(H.p.cenas[falta[k]].texto, ms.voz, ms.vel, ms.tom), 'ia'); } H.aviso('✅ Vozes prontas.', 'ok'); }
      catch (er) { H.aviso('❌ ' + er.message, 'erro', 8000); }
      ocupado = false; pintar(); return;
    }
    if (id === 'ms-trazer') {
      const fs = await escolherArquivos(true); if (!fs.length) return;
      let ok = 0; const sem = [];
      for (const f of fs) {
        const m = /(\d+)(?!.*\d)/.exec(f.name.replace(/\.[^.]+$/, '')); const i = m ? +m[1] - 1 : -1;
        if (i >= 0 && i < H.p.cenas.length) { await porAudio(H.p.cenas[i], f, 'ia'); ok++; } else sem.push(f.name);
      }
      H.aviso('✅ ' + ok + ' vozes colocadas' + (sem.length ? '. Sem número de cena: ' + sem.join(', ') : '.'), sem.length ? 'erro' : 'ok', 7000);
      pintar(); return;
    }
    const box = b.closest('.cena'); if (!box || !b.dataset.a) return;
    const i = +box.dataset.i, c = H.p.cenas[i], a = b.dataset.a;
    if (a === 'gravar') gravar(i);
    else if (a === 'previa') previa(i);
    else if (a === 'importar') { const [f] = await escolherArquivos(false); if (f) { await porAudio(c, f, 'arquivo'); H.aviso('✅ Áudio colocado na cena ' + (i + 1) + '.', 'ok'); pintar(); } }
    else if (a === 'melhorar') {
      b.disabled = true; b.textContent = '✨ …';
      try { await melhorarCena(c); H.aviso('✅ Voz melhorada.', 'ok'); } catch (er) { H.aviso('❌ ' + er.message, 'erro', 6000); }
      pintar();
    } else if (a === 'original') { await voltarOriginal(c); pintar(); }
    else if (a === 'gerar') {
      if (ocupado) return; ocupado = true; lerGemini(); b.disabled = true; b.textContent = '⏳ Gerando…';
      try { await gerarCena(i); H.aviso('✅ Voz da cena ' + (i + 1) + ' pronta.', 'ok'); } catch (er) { H.aviso('❌ ' + er.message, 'erro', 8000); }
      ocupado = false; pintar();
    } else if (a === 'tirar') {
      if (!confirm('Tirar a voz da cena ' + (i + 1) + '?')) return;
      await H.banco.apagarMidia(c.audioId); await H.banco.apagarMidia(c.audioOrigId);
      c.audioId = ''; c.audioOrigId = ''; c.audioTipo = ''; await H.salvar(true); pintar();
    }
  });
})(window.H);
