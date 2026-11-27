/* Estúdio de Histórias — 42-som.js: deixar a voz gravada limpa e "de locutor" (tudo no aparelho, sem internet).
   Passos: tira o ruído de fundo (aprende o chiado nos trechos mais baixos), corta os silêncios das pontas,
   equaliza (corpo, tira o "abafado", dá presença e brilho), comprime, iguala o volume e, se quiser, põe uma sala leve. */
(function (H) {
  const TAXA = 44100;

  // ---------- FFT simples (radix-2) ----------
  function fft(re, im, inv) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2;
          const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
    if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }

  // ---------- tira o ruído de fundo (subtração espectral) ----------
  function tirarRuido(x, forca) {
    const N = 1024, PASSO = 256, nb = N / 2 + 1;
    const jan = new Float32Array(N); for (let i = 0; i < N; i++) jan[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
    const quadros = Math.max(1, Math.ceil((x.length - N) / PASSO) + 1);
    const mags = new Array(quadros), energia = new Float32Array(quadros);
    const re = new Float32Array(N), im = new Float32Array(N);
    const specRe = new Array(quadros), specIm = new Array(quadros);
    for (let q = 0; q < quadros; q++) {
      const o = q * PASSO;
      for (let i = 0; i < N; i++) { re[i] = (x[o + i] || 0) * jan[i]; im[i] = 0; }
      fft(re, im, false);
      const m = new Float32Array(nb); let e = 0;
      for (let k = 0; k < nb; k++) { m[k] = Math.hypot(re[k], im[k]); e += m[k] * m[k]; }
      mags[q] = m; energia[q] = e; specRe[q] = re.slice(0, nb); specIm[q] = im.slice(0, nb);
    }
    // perfil do ruído = média dos 12% de quadros mais baixos
    const ord = Array.from(energia.keys()).sort((a, b) => energia[a] - energia[b]);
    const nq = Math.max(1, Math.floor(quadros * 0.12)), ruido = new Float32Array(nb);
    for (let j = 0; j < nq; j++) { const m = mags[ord[j]]; for (let k = 0; k < nb; k++) ruido[k] += m[k] / nq; }
    const alfa = 1.2 + forca * 1.3, piso = 0.12 - forca * 0.06;
    const saida = new Float32Array(x.length + N), peso = new Float32Array(x.length + N);
    let ganhoAnt = new Float32Array(nb).fill(1);
    for (let q = 0; q < quadros; q++) {
      const m = mags[q], g = new Float32Array(nb);
      for (let k = 0; k < nb; k++) {
        let v = 1 - alfa * ruido[k] / (m[k] + 1e-9); if (v < piso) v = piso;
        g[k] = 0.6 * v + 0.4 * ganhoAnt[k]; // suaviza no tempo (evita "som de robô")
      }
      ganhoAnt = g;
      for (let k = 0; k < nb; k++) { re[k] = specRe[q][k] * g[k]; im[k] = specIm[q][k] * g[k]; }
      for (let k = 1; k < N / 2; k++) { re[N - k] = re[k]; im[N - k] = -im[k]; }
      fft(re, im, true);
      const o = q * PASSO;
      for (let i = 0; i < N; i++) { saida[o + i] += re[i] * jan[i]; peso[o + i] += jan[i] * jan[i]; }
    }
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) y[i] = peso[i] > 1e-6 ? saida[i] / peso[i] : 0;
    return y;
  }

  // corta silêncio no começo e no fim (deixa 0,15 s)
  function aparar(x, taxa) {
    const bloco = Math.round(taxa * 0.02); let max = 0;
    for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > max) max = a; }
    const lim = max * 0.06; let ini = 0, fim = x.length;
    for (let i = 0; i < x.length; i += bloco) { let p = 0; for (let j = i; j < i + bloco && j < x.length; j++) p = Math.max(p, Math.abs(x[j])); if (p > lim) { ini = i; break; } }
    for (let i = x.length - bloco; i > 0; i -= bloco) { let p = 0; for (let j = i; j < i + bloco; j++) p = Math.max(p, Math.abs(x[j])); if (p > lim) { fim = i + bloco; break; } }
    const folga = Math.round(taxa * 0.15);
    return x.slice(Math.max(0, ini - folga), Math.min(x.length, fim + folga));
  }

  function salaImpulso(ctx) {
    const n = Math.round(ctx.sampleRate * 0.9), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    return b;
  }

  // ---------- receitas ----------
  H.PRESETS = {
    locutor: { nome: '🎙️ Locutor (limpa, encorpada e clara)', ruido: 0.7, grave: 3, abafado: -3.5, presenca: 3.5, brilho: 2.5, comp: true, sala: 0 },
    limpa: { nome: '🧼 Só limpar o ruído', ruido: 0.8, grave: 0, abafado: -1, presenca: 1, brilho: 0, comp: true, sala: 0 },
    sala: { nome: '🏠 Locutor com sala leve (menos seca)', ruido: 0.7, grave: 2.5, abafado: -3, presenca: 3, brilho: 2, comp: true, sala: 0.1 },
    radio: { nome: '📻 Rádio (bem na cara)', ruido: 0.8, grave: 4, abafado: -4, presenca: 5, brilho: 3, comp: true, sala: 0 }
  };

  H.som = {
    // recebe um Blob de áudio, devolve um Blob WAV melhorado
    async melhorar(blob, receita) {
      const r = H.PRESETS[receita] || H.PRESETS.locutor;
      const tmp = new (window.AudioContext || window.webkitAudioContext)();
      let buf; try { buf = await tmp.decodeAudioData(await blob.arrayBuffer()); } finally { try { tmp.close(); } catch (e) {} }
      // mistura em mono e leva para 44,1 kHz
      const mono = new OfflineAudioContext(1, Math.ceil(buf.duration * TAXA), TAXA);
      const s0 = mono.createBufferSource(); s0.buffer = buf; s0.connect(mono.destination); s0.start();
      let x = (await mono.startRendering()).getChannelData(0);
      if (r.ruido > 0) x = tirarRuido(x, r.ruido);
      x = aparar(x, TAXA);
      // equalizador + compressor (+ sala)
      const cauda = r.sala ? 0.9 : 0.05;
      const oc = new OfflineAudioContext(1, Math.ceil((x.length / TAXA + cauda) * TAXA), TAXA);
      const ent = oc.createBuffer(1, x.length, TAXA); ent.copyToChannel(x, 0);
      const src = oc.createBufferSource(); src.buffer = ent;
      const f = (tipo, freq, ganho, q) => { const b = oc.createBiquadFilter(); b.type = tipo; b.frequency.value = freq; if (ganho != null) b.gain.value = ganho; if (q) b.Q.value = q; return b; };
      const cadeia = [f('highpass', 80, null, 0.7), f('lowshelf', 140, r.grave), f('peaking', 320, r.abafado, 1.1), f('peaking', 3200, r.presenca, 0.9), f('peaking', 6800, -1.5, 3), f('highshelf', 10000, r.brilho)];
      if (r.comp) { const c = oc.createDynamicsCompressor(); c.threshold.value = -24; c.knee.value = 8; c.ratio.value = 3.5; c.attack.value = 0.006; c.release.value = 0.18; cadeia.push(c); }
      let no = src; cadeia.forEach((n) => { no.connect(n); no = n; });
      no.connect(oc.destination);
      if (r.sala) { const cv = oc.createConvolver(); cv.buffer = salaImpulso(oc); const g = oc.createGain(); g.gain.value = r.sala; no.connect(cv); cv.connect(g); g.connect(oc.destination); }
      src.start();
      const y = (await oc.startRendering()).getChannelData(0);
      // iguala o volume: alvo de voz -17 dB (RMS), sem passar de -1 dB no pico
      let pico = 0, soma = 0, n = 0;
      for (let i = 0; i < y.length; i++) { const a = Math.abs(y[i]); if (a > pico) pico = a; if (a > 0.01) { soma += y[i] * y[i]; n++; } }
      const rms = Math.sqrt(soma / Math.max(1, n)) || 1e-4;
      const ganho = Math.min(Math.pow(10, -17 / 20) / rms, Math.pow(10, -1 / 20) / (pico || 1));
      const out = new Float32Array(y.length);
      for (let i = 0; i < y.length; i++) { let v = y[i] * ganho; out[i] = v > 0.99 ? 0.99 : v < -0.99 ? -0.99 : v; }
      return H.som.wav(out, TAXA);
    },
    wav(amostras, taxa) {
      const n = amostras.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
      const t = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      t(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); t(8, 'WAVE'); t(12, 'fmt '); v.setUint32(16, 16, true);
      v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, taxa, true); v.setUint32(28, taxa * 2, true);
      v.setUint16(32, 2, true); v.setUint16(34, 16, true); t(36, 'data'); v.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, amostras[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
      return new Blob([b], { type: 'audio/wav' });
    },
    // PCM 16 bits sem cabeçalho → WAV
    pcmParaWav(bytes, taxa) {
      const n = Math.floor(bytes.length / 2), a = new Float32Array(n), v = new DataView(bytes.buffer, bytes.byteOffset, n * 2);
      for (let i = 0; i < n; i++) a[i] = v.getInt16(i * 2, true) / 32768;
      return H.som.wav(a, taxa);
    }
  };
})(window.H);
