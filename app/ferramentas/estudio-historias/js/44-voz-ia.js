/* Estúdio de Histórias — 44-voz-ia.js: outras vozes para narrar.
   🤖 Voz da IA do Google (Gemini TTS, direto no app, com a sua chave do Gemini)
   💻 Vozes da Microsoft (Antonio, Francisca, Thalita) por um programinha no PC ou no Termux (edge-tts, grátis). */
(function (H) {
  H.VOZES_GEMINI = [
    ['Charon', 'informativa (boa para explicar)'], ['Kore', 'firme'], ['Orus', 'firme'], ['Alnilam', 'firme'],
    ['Gacrux', 'madura'], ['Sadaltager', 'de quem entende do assunto'], ['Rasalgethi', 'informativa'], ['Algenib', 'rouca'],
    ['Sulafat', 'calorosa'], ['Achird', 'amigável'], ['Vindemiatrix', 'gentil'], ['Achernar', 'suave'],
    ['Algieba', 'macia'], ['Despina', 'macia'], ['Schedar', 'equilibrada'], ['Iapetus', 'clara'], ['Erinome', 'clara'],
    ['Enceladus', 'sussurrada'], ['Umbriel', 'tranquila'], ['Callirrhoe', 'tranquila'], ['Zubenelgenubi', 'descontraída'],
    ['Puck', 'animada'], ['Laomedeia', 'animada'], ['Fenrir', 'empolgada'], ['Sadachbia', 'cheia de vida'],
    ['Zephyr', 'brilhante'], ['Autonoe', 'brilhante'], ['Aoede', 'leve'], ['Leda', 'jovem'], ['Pulcherrima', 'decidida']
  ];
  H.VOZES_MS = [
    ['pt-BR-FranciscoNeural', 'Francisco (a voz do seu jurídico)'],
    ['pt-BR-AntonioNeural', 'Antonio (homem, natural)'],
    ['pt-BR-FranciscaNeural', 'Francisca (mulher, natural)'],
    ['pt-BR-ThalitaMultilingualNeural', 'Thalita (mulher, bem expressiva)']
  ];
  H.ESTILO_ANGULO = {
    emocionante: 'Narre como um contador de histórias brasileiro: voz calorosa, emoção contida, ritmo pausado, dando peso às palavras importantes.',
    misterio: 'Narre com suspense, voz mais baixa e intrigante, pausas antes das revelações.',
    indignacao: 'Narre com indignação controlada, firme e convicta, como quem denuncia uma injustiça.',
    educativo: 'Narre como um professor simpático: claro, didático, sem pressa, tom de conversa.',
    motivacional: 'Narre com energia e esperança, voz confiante e inspiradora.',
    humor: 'Narre com leveza e bom humor, tom de conversa entre amigos.'
  };

  const cfg = () => H.pref.get('vozIA', { voz: 'Charon', estilo: '', modelo: 'gemini-3.8-flash-tts', chave: '' });
  H.vozIA = {
    cfg,
    salvar(c) { H.pref.set('vozIA', Object.assign(cfg(), c)); },
    chave() { const c = cfg(); if (c.chave) return c.chave; const ia = H.ia.config(); return ia.prov === 'gemini' ? ia.chave : ''; },
    estilo() { return cfg().estilo || H.ESTILO_ANGULO[(H.p && H.p.angulo) || 'emocionante']; },

    // gera a fala de um texto → Blob WAV
    async falar(texto, vozNome, tom) {
      const c = cfg(), chave = this.chave();
      if (!chave) throw new Error('Falta a chave do Gemini. Coloque em 🎙️ Voz → Voz da IA, ou use o Gemini em ⚙️ Config.');
      const modelo = c.modelo || 'gemini-3.8-flash-tts', voz = vozNome || c.voz || 'Charon';
      const limpo = H.limpo(texto).replace(/(…|\.\.\.)/g, ' <short pause> ').replace(/\s+/g, ' ').trim();
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelo) + ':generateContent?key=' + encodeURIComponent(chave);
      const estilo = this.estilo() + (tom ? ' Nesta parte: ' + tom + '.' : '');
      const corpoNovo = { contents: [{ role: 'user', parts: [{ text: limpo, speech_metadata: { style: estilo } }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { voice: voz } } } };
      // jeito antigo (modelos "preview"): estilo vai escrito antes do texto
      const corpoVelho = { contents: [{ role: 'user', parts: [{ text: estilo + '\n\n' + H.limpo(texto) }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } } } };
      let r, d, txt;
      for (const corpo of [corpoNovo, corpoVelho]) {
        try { r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) }); }
        catch (e) { throw new Error('Sem conexão com o Google. Confira a internet.'); }
        txt = await r.text(); d = null; try { d = JSON.parse(txt); } catch (e) {}
        if (r.ok || r.status !== 400) break;
      }
      if (!r.ok) {
        const m = (d && d.error && d.error.message) || txt.slice(0, 200);
        if (r.status === 401 || r.status === 403) throw new Error('A chave do Gemini foi recusada (' + r.status + ').');
        if (r.status === 429) throw new Error('A cota de voz do Gemini acabou por agora (429). Espere um pouco e continue depois: as cenas prontas ficam guardadas.');
        if (r.status === 404) throw new Error('Esse modelo de voz não existe mais (' + modelo + '). Troque o modelo em 🎙️ Voz → Voz da IA.');
        throw new Error('O Gemini respondeu erro ' + r.status + ': ' + String(m).slice(0, 200));
      }
      const parte = ((d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || []).find((p) => p.inlineData || p.inline_data);
      if (!parte) throw new Error('O Gemini não mandou áudio. Tente de novo.');
      const dado = parte.inlineData || parte.inline_data, bin = atob(dado.data), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return new Blob([bytes], { type: 'audio/wav' });
      const taxa = +((/rate=(\d+)/.exec(dado.mimeType || dado.mime_type || '') || [])[1] || 24000);
      return H.som.pcmParaWav(bytes, taxa);
    },

    // 🔌 ponte de voz: programinha que fica ligado no PC ou no Termux e entrega a voz direto para o app
    ponte: {
      // 7790 = a voz Francisco do programa do PC (Meu Chat / Mini SK / Estúdio para PC) ou o voz-francisco.py do Termux
      // 5577 = a ponte-voz.py baixada aqui
      url: '', tipo: '',
      async ligada() {
        for (const [u, cam, tipo] of [['http://127.0.0.1:7790', '/ping', 'francisco'], ['http://127.0.0.1:5577', '/ok', 'ponte']]) {
          try { const r = await fetch(u + cam, { cache: 'no-store', signal: AbortSignal.timeout(2500) }); if (r.ok) { this.url = u; this.tipo = tipo; return true; } } catch (e) {}
        }
        return false;
      },
      async falar(texto, voz, vel, tom) {
        if (!this.url && !(await this.ligada())) throw new Error('A voz do PC não está ligada. Abra o programa do PC (Meu Chat/Estúdio) ou a ponte-voz.py.');
        let r; const t = H.limpo(texto).replace(/…/g, '...');
        const corpo = this.tipo === 'francisco' ? { texto: t, voz, velocidade: vel, tom } : { texto: t, voz, vel, tom };
        try { r = await fetch(this.url + '/falar', { method: 'POST', headers: { 'content-type': this.tipo === 'francisco' ? 'text/plain' : 'application/json' }, body: JSON.stringify(corpo) }); }
        catch (e) { throw new Error('A ponte de voz não está ligada. Abra o programa ponte-voz.py no PC ou no Termux.'); }
        if (!r.ok) throw new Error('A ponte de voz deu erro: ' + (await r.text()).slice(0, 200));
        const b = await r.blob(); if (b.size < 500) throw new Error('A ponte mandou um áudio vazio.');
        return b;
      }
    },
    programaPonte() {
      return [
        '# -*- coding: utf-8 -*-',
        '# Estúdio de Histórias — PONTE DE VOZ. Deixe este programa aberto enquanto usa o app.',
        '# O app manda o texto de cada cena e a ponte devolve a voz pronta (Microsoft: Antonio, Francisca, Thalita).',
        '# Grátis, precisa de internet. Funciona no PC e no celular (Termux).',
        '#',
        '# NO PC:      pip install edge-tts      e depois      python ponte-voz.py',
        '# NO TERMUX:  pkg install python  ;  pip install edge-tts  ;  termux-setup-storage',
        '#             python ~/storage/downloads/ponte-voz.py',
        '# Para desligar: feche a janela (ou Ctrl+C).',
        'import asyncio, json, tempfile, os',
        'from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer',
        'try:',
        '    import edge_tts',
        'except ImportError:',
        '    print("Falta instalar: pip install edge-tts"); raise SystemExit(1)',
        '',
        'PORTA = 5577',
        '',
        'async def gerar(texto, voz, vel, tom, arq):',
        '    await edge_tts.Communicate(texto, voz, rate=vel, pitch=tom).save(arq)',
        '',
        'class Ponte(BaseHTTPRequestHandler):',
        '    def cabecalhos(self, codigo, tipo="text/plain; charset=utf-8"):',
        '        self.send_response(codigo)',
        '        self.send_header("Content-Type", tipo)',
        '        self.send_header("Access-Control-Allow-Origin", "*")',
        '        self.send_header("Access-Control-Allow-Headers", "content-type")',
        '        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")',
        '        self.send_header("Access-Control-Allow-Private-Network", "true")',
        '    def do_OPTIONS(self):',
        '        self.cabecalhos(204); self.end_headers()',
        '    def do_GET(self):',
        '        self.cabecalhos(200); self.end_headers(); self.wfile.write("ok".encode())',
        '    def do_POST(self):',
        '        try:',
        '            n = int(self.headers.get("Content-Length", "0"))',
        '            d = json.loads(self.rfile.read(n).decode("utf-8"))',
        '            texto = str(d.get("texto", "")).strip()',
        '            if not texto: raise ValueError("texto vazio")',
        '            fd, arq = tempfile.mkstemp(suffix=".mp3"); os.close(fd)',
        '            asyncio.run(gerar(texto, d.get("voz") or "pt-BR-AntonioNeural", d.get("vel") or "+0%", d.get("tom") or "+0Hz", arq))',
        '            dados = open(arq, "rb").read(); os.remove(arq)',
        '            self.cabecalhos(200, "audio/mpeg"); self.send_header("Content-Length", str(len(dados))); self.end_headers(); self.wfile.write(dados)',
        '            print("  voz pronta:", texto[:60])',
        '        except Exception as e:',
        '            self.cabecalhos(500); self.end_headers(); self.wfile.write(str(e).encode("utf-8"))',
        '            print("  ERRO:", e)',
        '    def log_message(self, *a):',
        '        pass',
        '',
        'print("Ponte de voz LIGADA em http://127.0.0.1:%d — deixe esta janela aberta." % PORTA)',
        'ThreadingHTTPServer(("127.0.0.1", PORTA), Ponte).serve_forever()',
        ''
      ].join('\n');
    },

    // programinha Python que gera um MP3 por cena com a voz da Microsoft
    programaMS(voz, velocidade, tom) {
      const nome = H.nomeArquivo(H.p.titulo);
      const textos = H.p.cenas.map((c) => H.limpo(c.texto).replace(/…/g, '...'));
      return [
        '# -*- coding: utf-8 -*-',
        '# Estúdio de Histórias — vozes da Microsoft para "' + (H.p.titulo || 'sem nome').replace(/[\r\n]/g, ' ') + '"',
        '# Gera um arquivo MP3 por cena (cena-01.mp3, cena-02.mp3...). Grátis, precisa de internet.',
        '#',
        '# NO PC (Windows):  abra o Prompt de Comando nesta pasta e digite:',
        '#     pip install edge-tts',
        '#     python ' + nome + '-vozes.py',
        '# NO CELULAR (Termux):',
        '#     pkg install python  (só da primeira vez)',
        '#     pip install edge-tts  (só da primeira vez)',
        '#     termux-setup-storage  (só da primeira vez)',
        '#     python ~/storage/downloads/' + nome + '-vozes.py',
        '# Depois, no app: 🎙️ Voz → 📂 Trazer as vozes (todas de uma vez).',
        'import asyncio, json, os',
        'try:',
        '    import edge_tts',
        'except ImportError:',
        '    print("Falta instalar: pip install edge-tts"); raise SystemExit(1)',
        '',
        'VOZ = ' + JSON.stringify(voz),
        'VELOCIDADE = ' + JSON.stringify(velocidade),
        'TOM = ' + JSON.stringify(tom),
        'CENAS = json.loads(r"""' + JSON.stringify(textos).replace(/[\u0080-￿]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')).replace(/"""/g, '\\"\\"\\"') + '""")',
        '',
        'def pasta_saida():',
        '    base = os.path.expanduser("~/storage/downloads")',
        '    if not os.path.isdir(base):',
        '        base = os.path.dirname(os.path.abspath(__file__))',
        '    p = os.path.join(base, ' + JSON.stringify('vozes-' + nome) + ')',
        '    os.makedirs(p, exist_ok=True)',
        '    return p',
        '',
        'async def main():',
        '    p = pasta_saida()',
        '    for i, texto in enumerate(CENAS, 1):',
        '        arq = os.path.join(p, "cena-%02d.mp3" % i)',
        '        print("Cena %d de %d..." % (i, len(CENAS)))',
        '        await edge_tts.Communicate(texto, VOZ, rate=VELOCIDADE, pitch=TOM).save(arq)',
        '    print("\\nPronto! Os audios estao na pasta:", p)',
        '',
        'asyncio.run(main())',
        ''
      ].join('\n');
    }
  };
})(window.H);
