/* Estúdio de Histórias — 46-musica.js: música de fundo criada pelo próprio app, conforme o clima da história.
   É gerada na hora (sintetizador): não tem direitos autorais, pode usar no YouTube sem problema. */
(function (H) {
  H.CLIMAS = {
    suspense: '🕵️ Suspense (aquela que chama atenção, meio de medo)',
    emocionante: '❤️ Emocionante (piano e cordas suaves)',
    motivacional: '💪 Motivacional (pra cima)',
    leve: '🙂 Leve (explicação, humor)'
  };
  H.climaDoAngulo = (a) => ({ misterio: 'suspense', indignacao: 'suspense', emocionante: 'emocionante', motivacional: 'motivacional', educativo: 'leve', humor: 'leve' }[a] || 'emocionante');

  const nota = (n) => 440 * Math.pow(2, (n - 69) / 12); // número MIDI → Hz
  const PROG = {
    suspense: [[45, 52, 57, 60], [46, 53, 58, 61], [45, 52, 57, 60], [44, 51, 56, 59]],
    emocionante: [[57, 64, 69, 72], [53, 60, 65, 69], [48, 55, 60, 64], [55, 62, 67, 71]],
    motivacional: [[48, 55, 60, 64], [55, 62, 67, 71], [57, 64, 69, 72], [53, 60, 65, 69]],
    leve: [[50, 57, 62, 66], [55, 62, 67, 71], [52, 59, 64, 67], [57, 64, 69, 73]]
  };

  function sala(ctx, seg) {
    const n = Math.round(ctx.sampleRate * seg), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5); }
    return b;
  }

  H.musica = {
    // trilha que muda de clima junto com a história: blocos [{clima, ini, dur}] → um AudioBuffer só, com troca suave
    async trilha(blocos, total) {
      const TAXA = 32000, cross = 1.8;
      const oc = new OfflineAudioContext(2, Math.ceil((total + 1) * TAXA), TAXA);
      for (let i = 0; i < blocos.length; i++) {
        const b = blocos[i], ini = Math.max(0, b.ini - (i ? cross / 2 : 0)), fim = Math.min(total + 1, b.ini + b.dur + (i < blocos.length - 1 ? cross / 2 : 0));
        const buf = await this.criar(b.clima, fim - ini + 2.5);
        const s = oc.createBufferSource(), g = oc.createGain(); s.buffer = buf;
        // a música de cada bloco já entra devagar; aqui só garante a troca suave no fim
        g.gain.setValueAtTime(1, ini); g.gain.setValueAtTime(1, Math.max(ini, fim - cross)); g.gain.linearRampToValueAtTime(0, fim);
        s.connect(g); g.connect(oc.destination); s.start(ini); s.stop(fim + 0.05);
      }
      return oc.startRendering();
    },
    // devolve um AudioBuffer com a música (duração em segundos)
    async criar(clima, duracao) {
      clima = PROG[clima] ? clima : 'emocionante';
      const TAXA = 32000, dur = Math.max(4, duracao), ctx = new OfflineAudioContext(2, Math.ceil((dur + 3) * TAXA), TAXA);
      const mestre = ctx.createGain(); mestre.gain.value = 0.5;
      const rev = ctx.createConvolver(); rev.buffer = sala(ctx, clima === 'suspense' ? 3.5 : 2.4);
      const molhado = ctx.createGain(); molhado.gain.value = clima === 'suspense' ? 0.55 : 0.35;
      mestre.connect(ctx.destination); mestre.connect(rev); rev.connect(molhado); molhado.connect(ctx.destination);
      const prog = PROG[clima], compasso = clima === 'motivacional' ? 2.4 : clima === 'leve' ? 2.8 : 4.8;

      function tom(f, ini, len, tipo, vol, ataque, solta, destino, filtro) {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.value = f;
        let fim = g;
        if (filtro) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = filtro; o.connect(lp); lp.connect(g); } else o.connect(g);
        g.gain.setValueAtTime(0, ini); g.gain.linearRampToValueAtTime(vol, ini + ataque);
        g.gain.setValueAtTime(vol, Math.max(ini + ataque, ini + len - solta)); g.gain.linearRampToValueAtTime(0, ini + len);
        fim.connect(destino || mestre); o.start(ini); o.stop(ini + len + 0.05);
      }
      function piano(f, ini, vol) { // nota "tocada": ataque rápido e some devagar
        const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2;
        const g2 = ctx.createGain(); g2.gain.value = 0.3; o2.connect(g2); g2.connect(g); o.connect(g);
        g.gain.setValueAtTime(0, ini); g.gain.linearRampToValueAtTime(vol, ini + 0.008); g.gain.exponentialRampToValueAtTime(0.0008, ini + 2.2);
        g.connect(mestre); o.start(ini); o2.start(ini); o.stop(ini + 2.3); o2.stop(ini + 2.3);
      }

      for (let t = 0, k = 0; t < dur + 1; t += compasso, k++) {
        const ac = prog[k % prog.length];
        if (clima === 'suspense') {
          // drone grave + batida de coração + nota aguda estranha de vez em quando
          tom(nota(ac[0] - 12), t, compasso + 0.6, 'sawtooth', 0.1, 1.2, 1.2, null, 260);
          tom(nota(ac[0] - 12) * 1.006, t, compasso + 0.6, 'sawtooth', 0.08, 1.2, 1.2, null, 240);
          tom(nota(ac[2]), t, compasso + 0.6, 'sine', 0.035, 2, 1.5);
          for (let b = 0; b < compasso; b += 1.2) { tom(55, t + b, 0.18, 'sine', 0.5, 0.005, 0.15); tom(52, t + b + 0.28, 0.16, 'sine', 0.35, 0.005, 0.14); }
          if (k % 2 === 1) tom(nota(ac[3] + 12), t + 1.5, 2.6, 'sine', 0.025, 1, 1.4);
        } else {
          // tapete de acordes (cordas)
          ac.forEach((n, j) => tom(nota(n), t, compasso + 0.8, j ? 'triangle' : 'sawtooth', j ? 0.05 : 0.035, compasso * 0.3, compasso * 0.35, null, 1800));
          tom(nota(ac[0] - 12), t, compasso + 0.4, 'sine', 0.12, 0.3, 0.6);
          // arpejo de "piano"
          const passo = clima === 'motivacional' ? 0.3 : clima === 'leve' ? 0.35 : 0.6;
          const notas = [ac[1] + 12, ac[2] + 12, ac[3] + 12, ac[2] + 12];
          for (let b = 0, q = 0; b < compasso - 0.05; b += passo, q++) piano(nota(notas[q % 4]), t + b, clima === 'emocionante' ? 0.09 : 0.07);
          if (clima === 'motivacional') for (let b = 0; b < compasso; b += 0.6) { tom(60, t + b, 0.22, 'sine', 0.35, 0.004, 0.2); }
        }
      }
      // entra e sai devagar
      mestre.gain.setValueAtTime(0, 0); mestre.gain.linearRampToValueAtTime(0.5, 2); mestre.gain.setValueAtTime(0.5, dur - 2.5); mestre.gain.linearRampToValueAtTime(0, dur);
      const buf = await ctx.startRendering();
      let pico = 0; for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) pico = Math.max(pico, Math.abs(d[i])); }
      if (pico > 0) for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= 0.9 / pico; }
      return buf;
    }
  };
})(window.H);
