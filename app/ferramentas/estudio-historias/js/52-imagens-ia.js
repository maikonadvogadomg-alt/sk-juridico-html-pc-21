/* Estúdio de Histórias — 52-imagens-ia.js: criar imagens com IA, adaptadas ao caso de cada cena.
   🎨 Pollinations (grátis, sem chave) ou 🍌 Gemini (com a sua chave do Gemini). */
(function (H) {
  H.ESTILOS_VISUAIS = {
    cinema: ['🎥 Foto de cinema (realista)', 'cinematic photo, realistic, dramatic natural lighting, shallow depth of field, 35mm film look'],
    ilustracao: ['🖌️ Ilustração', 'digital illustration, soft colors, storytelling style'],
    desenho: ['🧸 Desenho animado', '3D cartoon style, Pixar-like, expressive characters, warm lighting'],
    aquarela: ['🎨 Aquarela', 'watercolor painting, gentle textures, emotional'],
    noir: ['🕶️ Suspense escuro', 'dark moody cinematic photo, high contrast, mysterious shadows, film noir mood']
  };
  const cfg = () => H.pref.get('imgIA', { fonte: 'pollinations', estilo: 'cinema', modelo: 'gemini-2.5-flash-image' });

  function promptDaCena(c) {
    const est = (H.ESTILOS_VISUAIS[cfg().estilo] || H.ESTILOS_VISUAIS.cinema)[1];
    const base = c.prompt || [c.busca, c.imagem].filter(Boolean).join(', ') || H.limpo(c.texto).slice(0, 160);
    return base + ', set in Brazil, ' + est + ', no text, no letters, no watermark, no logos';
  }

  H.imgIA = {
    cfg,
    salvar(c) { H.pref.set('imgIA', Object.assign(cfg(), c)); },
    promptDaCena,
    async criar(c) {
      const k = cfg(), vertical = H.p.formato !== 'horizontal', prompt = promptDaCena(c);
      if (k.fonte === 'gemini') {
        const chave = H.vozIA.chave();
        if (!chave) throw new Error('Falta a chave do Gemini (coloque em ⚙️ Config ou na aba 🎙️ Voz).');
        let r;
        try {
          r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(k.modelo || 'gemini-2.5-flash-image') + ':generateContent?key=' + encodeURIComponent(chave), {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Create an image: ' + prompt }] }],
              generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: vertical ? '9:16' : '16:9' } } })
          });
        } catch (e) { throw new Error('Sem conexão com o Google.'); }
        const t = await r.text(); let d = null; try { d = JSON.parse(t); } catch (e) {}
        if (!r.ok) {
          if (r.status === 429) throw new Error('A cota de imagens do Gemini acabou por agora (429). Troque para "Pollinations (grátis)".');
          if (r.status === 404) throw new Error('Esse modelo de imagem não existe mais. Troque o modelo ou use "Pollinations (grátis)".');
          throw new Error('O Gemini respondeu erro ' + r.status + ': ' + ((d && d.error && d.error.message) || t).slice(0, 160));
        }
        const p = ((d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || []).find((x) => x.inlineData || x.inline_data);
        if (!p) throw new Error('O Gemini não mandou imagem (às vezes ele recusa). Tente de novo ou use "Pollinations".');
        const dd = p.inlineData || p.inline_data, bin = atob(dd.data), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        return new Blob([u], { type: dd.mimeType || dd.mime_type || 'image/png' });
      }
      // Pollinations: grátis e sem chave (pode demorar um pouco)
      const w = vertical ? 720 : 1280, h = vertical ? 1280 : 720, seed = Math.floor(Math.random() * 1e6);
      const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?width=' + w + '&height=' + h + '&nologo=true&seed=' + seed;
      let r;
      for (let tent = 0; tent < 3; tent++) {
        try { r = await fetch(url); } catch (e) { r = null; }
        if (r && r.ok) break;
        await new Promise((ok) => setTimeout(ok, 6000 * (tent + 1)));
      }
      if (!r || !r.ok) throw new Error('O serviço grátis de imagens não respondeu agora' + (r ? ' (' + r.status + ')' : '') + '. Tente daqui a pouco.');
      const b = await r.blob();
      if (!/^image\//.test(b.type) || b.size < 3000) throw new Error('O serviço de imagens mandou uma resposta estranha. Tente de novo.');
      return b;
    }
  };
})(window.H);
