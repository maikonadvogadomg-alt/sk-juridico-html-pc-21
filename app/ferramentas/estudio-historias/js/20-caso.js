/* Estúdio de Histórias — 20-caso.js: contar o caso (falando ou escrevendo) e pedir o roteiro à IA. */
(function (H) {
  const CAMPOS = ['titulo', 'relato', 'plataforma', 'angulo', 'estilo', 'duracao', 'formato'];

  H.on('projeto', () => {
    CAMPOS.forEach((c) => { H.$('#' + c).value = H.p[c] || (c === 'formato' ? 'vertical' : ''); });
    if (!H.p.estilo) H.$('#estilo').value = 'historia';
    if (!H.p.duracao) H.$('#duracao').value = 'medio';
    if (!H.p.plataforma) H.$('#plataforma').value = H.p.formato === 'horizontal' ? 'youtube' : 'shorts';
    if (!H.p.angulo) H.$('#angulo').value = 'emocionante';
    H.$('#sigilo').checked = H.p.sigilo !== false;
  });
  CAMPOS.forEach((c) => H.$('#' + c).addEventListener('input', () => {
    H.p[c] = H.$('#' + c).value; H.salvar();
    if (c === 'titulo') H.emit('titulo');
  }));
  // a plataforma já escolhe o formato e o tamanho certos (dá para mudar depois)
  H.$('#plataforma').addEventListener('change', () => {
    const v = H.$('#plataforma').value, vert = v !== 'youtube';
    H.p.formato = vert ? 'vertical' : 'horizontal'; H.$('#formato').value = H.p.formato;
    H.p.duracao = vert ? 'curto' : 'medio'; H.$('#duracao').value = H.p.duracao;
    H.salvar();
  });
  H.$('#sigilo').addEventListener('change', () => { H.p.sigilo = H.$('#sigilo').checked; H.salvar(); });

  // 🎤 falar (o celular escreve o que você fala)
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, ligado = false;
  function parar() { ligado = false; try { rec && rec.stop(); } catch (e) {} H.$('#bt-falar').textContent = '🎤 Falar'; H.$('#bt-falar').classList.remove('gravando'); H.$('#falar-status').textContent = ''; }
  H.$('#bt-falar').onclick = () => {
    if (!Rec) { H.aviso('Este navegador não escreve o que você fala. Use o teclado com o microfone do teclado (o 🎤 do Gboard).', 'erro', 6000); return; }
    if (ligado) return parar();
    rec = new Rec(); rec.lang = 'pt-BR'; rec.continuous = true; rec.interimResults = true;
    const ta = H.$('#relato'); let base = ta.value;
    rec.onresult = (ev) => {
      let fim = '', meio = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) fim += t; else meio += t;
      }
      if (fim) { base = (base + (base && !/\s$/.test(base) ? ' ' : '') + fim.trim()).replace(/\s+([,.!?])/g, '$1'); }
      ta.value = base + (meio ? ' ' + meio : '');
      H.p.relato = base; H.salvar();
    };
    rec.onerror = (e) => { if (e.error === 'not-allowed') { H.aviso('O microfone foi bloqueado. Libere o microfone para este app.', 'erro', 6000); parar(); } };
    rec.onend = () => { if (ligado) { base = ta.value; try { rec.start(); } catch (e) { parar(); } } };
    try { rec.start(); ligado = true; } catch (e) { H.aviso('Não consegui ligar o microfone.', 'erro'); return; }
    H.$('#bt-falar').textContent = '⏹ Parar'; H.$('#bt-falar').classList.add('gravando');
    H.$('#falar-status').textContent = 'Ouvindo… pode falar à vontade.';
  };
  H.on('aba', (n) => { if (n !== 'caso' && ligado) parar(); });

  // 🪄 roteiro
  const ESTILOS = {
    historia: 'história emocionante e envolvente, contada como um caso real, com começo que prende, tensão, virada e desfecho',
    explicacao: 'explicação simples de um direito, para leigos, usando o caso como exemplo, sem juridiquês',
    curiosidade: 'curiosidade jurídica surpreendente, ritmo rápido, com uma revelação no final',
    vida: 'história de vida pessoal, contada em primeira pessoa, sincera e humana'
  };
  const TAMANHOS = { curto: '8 a 12 cenas curtas, cerca de 150 palavras no total (1 minuto)', medio: '20 a 28 cenas curtas, cerca de 430 palavras no total (3 minutos)', longo: '38 a 50 cenas curtas, cerca de 850 palavras no total (6 minutos)' };

  const PLATAFORMAS = {
    youtube: 'YouTube (vídeo normal, deitado): gancho forte nos primeiros 15 segundos, história bem desenvolvida, pede para comentar e se inscrever no fim',
    shorts: 'YouTube Shorts (em pé, até 60 segundos): gancho na PRIMEIRA frase, ritmo rápido, sem introdução, final que faz a pessoa querer ver de novo',
    reels: 'Instagram Reels (em pé, curto): gancho na primeira frase, linguagem próxima, final convida a salvar e compartilhar',
    tiktok: 'TikTok (em pé, curto): começa no meio da ação, frases bem curtas, ritmo rápido, final com pergunta para gerar comentários'
  };
  const ANGULOS = {
    emocionante: 'emocionante: faça o público sentir o que a pessoa sentiu',
    misterio: 'mistério: segure a informação principal e revele só no final',
    indignacao: 'injustiça: mostre o que estava errado e como foi corrigido, sem ofender ninguém',
    educativo: 'educativo: no fim o público precisa entender o direito que tem e o que fazer',
    motivacional: 'motivacional: mostre que vale a pena lutar pelos seus direitos',
    humor: 'leve e com humor, sem desrespeitar o cliente'
  };
  const PARTES = 'Cada cena tem uma "parte" da estrutura: GANCHO (prende), CONTEXTO (quem e onde), PROBLEMA (o conflito), VIRADA (o que mudou), DESFECHO (como acabou), LIÇÃO (o direito por trás) e CHAMADA (inscrever, comentar).';

  function sistema(p) {
    return [
      'Você é um roteirista brasileiro de vídeos para YouTube. Escreve em português do Brasil, natural, para ser NARRADO em voz alta.',
      'Estilo: ' + ESTILOS[p.estilo || 'historia'] + '.',
      'Tamanho: ' + TAMANHOS[p.duracao || 'medio'] + '.',
      'Plataforma: ' + PLATAFORMAS[p.plataforma || 'youtube'] + '.',
      'Ângulo: ' + ANGULOS[p.angulo || 'emocionante'] + '.',
      PARTES,
      'O narrador é um advogado que conta casos. Frases curtas, fáceis de falar, sem siglas difíceis (escreva por extenso na primeira vez).',
      'Marque ÊNFASE com *asteriscos* em volta da palavra (poucas por cena) e PAUSA com reticências (…).',
      'CENAS CURTAS: cada cena tem 1 ou 2 frases e UMA imagem que mostra exatamente o que está sendo falado naquele momento (falou da criança indo para a escola → criança indo para a escola; falou do juiz bravo → juiz bravo). Assim a imagem muda no tempo certo.',
      'Para cada cena diga o "clima" da música (um destes: suspense, emocionante, motivacional, leve) — mude o clima quando a história muda de ambiente (tensão → calma) — e o "tom": como o narrador deve falar aquela cena, em poucas palavras (ex.: "voz baixa e tensa, devagar", "aliviado e caloroso", "firme, com indignação").',
      'A primeira cena precisa prender a atenção nos primeiros 5 segundos. A última fecha a história e chama para se inscrever no canal de forma leve.',
      p.sigilo !== false ? 'SIGILO: troque TODOS os nomes de pessoas, cidades pequenas, empresas, números de processo e qualquer detalhe que identifique o cliente. Use nomes fictícios comuns.' : '',
      'NUNCA invente número de lei, artigo, súmula, processo ou jurisprudência. Só cite norma ou decisão se ela estiver no relato. Se precisar, fale de forma geral ("a lei garante…").',
      'Para cada cena, descreva a imagem de fundo (em português), dê palavras de busca em INGLÊS para banco de imagens grátis (ex.: "old farmer hands") e escreva um PROMPT em INGLÊS para criar a imagem com IA: detalhado, adaptado ao caso concreto e ao Brasil (pessoas, lugar, objetos, emoção, luz), sem texto escrito na imagem, mantendo a mesma pessoa com a mesma aparência em todas as cenas.',
      'Responda SOMENTE com JSON neste formato: {"titulo":"título chamativo do vídeo","descricao":"descrição para o YouTube, 2 a 4 frases","cenas":[{"parte":"GANCHO","texto":"o que o narrador fala","imagem":"descrição da imagem","busca":"english keywords","prompt":"detailed english prompt for the image","clima":"suspense","tom":"voz baixa e tensa"}]}'
    ].filter(Boolean).join('\n');
  }

  // faz o roteiro (usado pelo botão e pelo modo automático)
  H.fazerRoteiro = async function (perguntar) {
    const p = H.p;
    if (ligado) parar();
    if ((p.relato || '').trim().length < 40) throw new Error('Conte um pouco mais do caso (pelo menos umas duas frases).');
    if (!H.ia.pronta()) { H.abrirAba('config'); throw new Error('Primeiro coloque a chave da IA em ⚙️ Config.'); }
    if (perguntar && p.cenas.length && !confirm('Já existe um roteiro. Fazer outro no lugar?')) return false;
    const r = H.ia.lerJSON(await H.ia.pedir(sistema(p), 'RELATO DO CASO:\n' + p.relato.trim(), true));
    const cenas = Array.isArray(r.cenas) ? r.cenas.filter((c) => c && String(c.texto || '').trim()) : [];
    if (!cenas.length) throw new Error('A IA não mandou nenhuma cena. Tente de novo.');
    for (const c of p.cenas) { await H.banco.apagarMidia(c.audioId); await H.banco.apagarMidia(c.audioOrigId); await H.banco.apagarMidia(c.imgId); }
    p.roteiro = { titulo: String(r.titulo || ''), descricao: String(r.descricao || '') };
    p.cenas = cenas.map((c) => Object.assign(H.novaCena(String(c.texto).trim(), String(c.busca || '').trim(), String(c.imagem || '').trim()), { parte: String(c.parte || '').trim().toUpperCase().slice(0, 20), prompt: String(c.prompt || '').trim().slice(0, 600), clima: H.CLIMAS[c.clima] ? c.clima : '', tom: String(c.tom || '').trim().slice(0, 120) }));
    if (!p.titulo && r.titulo) { p.titulo = String(r.titulo); H.$('#titulo').value = p.titulo; H.emit('titulo'); }
    await H.salvar(true); H.emit('cenas');
    return true;
  };

  H.$('#bt-roteiro').onclick = async () => {
    const st = H.$('#roteiro-status'), bt = H.$('#bt-roteiro');
    bt.disabled = true; st.textContent = '⏳ A IA está escrevendo o roteiro…';
    try { if (await H.fazerRoteiro(true)) { st.textContent = '✅ Roteiro pronto: ' + H.p.cenas.length + ' cenas.'; H.abrirAba('roteiro'); } else st.textContent = ''; }
    catch (e) { st.textContent = '❌ ' + e.message; }
    finally { bt.disabled = false; }
  };

  // ⚡ faz tudo sozinho: roteiro → voz da IA → imagens da IA → música → vídeo
  H.$('#bt-tudo').onclick = async () => {
    const st = H.$('#roteiro-status'), bt = H.$('#bt-tudo'), p = H.p;
    const vozPC = await H.vozIA.ponte.ligada();
    if (!H.vozIA.chave() && !vozPC) { st.textContent = '❌ Para narrar sozinho preciso da voz da IA do Google (chave do Gemini em ⚙️ Config) ou da voz Francisco do PC (programa do PC ligado).'; return; }
    if (p.cenas.length && !confirm('Fazer tudo de novo? O roteiro, as vozes e as imagens atuais serão trocados.')) return;
    bt.disabled = true; H.$('#bt-roteiro').disabled = true;
    const passo = (t) => { st.textContent = t; };
    try {
      passo('⏳ 1/4 · Escrevendo o roteiro…'); await H.fazerRoteiro(false);
      if (vozPC && (H.pref.get('narrador', 'minha') === 'microsoft' || !H.vozIA.chave())) {
        const ms = H.pref.get('vozMS', { voz: 'pt-BR-FranciscoNeural', vel: '+0%', tom: '+0Hz' });
        const falta = H.p.cenas.filter((c) => !c.audioId);
        for (let k = 0; k < falta.length; k++) { passo('⏳ 2/4 · Voz Francisco: cena ' + (k + 1) + ' de ' + falta.length + '…'); await H.vozIA.porAudioCena(falta[k], await H.vozIA.ponte.falar(falta[k].texto, ms.voz, ms.vel, ms.tom)); }
      } else await H.vozIA.gerarFaltam((k, n) => passo('⏳ 2/4 · Gravando a voz: cena ' + k + ' de ' + n + '…'));
      let falhas = 0;
      await H.imgIA.criarFaltam((k, n) => passo('⏳ 3/4 · Criando as imagens: cena ' + k + ' de ' + n + '…'), () => { falhas++; });
      passo('⏳ 4/4 · Montando o vídeo (em tempo real, deixe a tela ligada)…' + (falhas ? ' ' + falhas + ' cena(s) ficaram sem imagem.' : ''));
      H.pref.set('musicaClima', 'auto');
      H.abrirAba('video'); await H.montarVideo();
      passo('✅ Pronto! O vídeo está na aba 🎞️ Vídeo.');
    } catch (e) { passo('❌ Parei aqui: ' + e.message + ' O que já ficou pronto está guardado; dá para continuar pelas abas.'); }
    finally { bt.disabled = false; H.$('#bt-roteiro').disabled = false; }
  };
})(window.H);
