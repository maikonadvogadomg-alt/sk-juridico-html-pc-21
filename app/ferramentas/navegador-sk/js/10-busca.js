/* Navegador SK — 10-busca.js: busca o site.
   No APK: direto (o Android não tem o bloqueio do navegador).
   No navegador: tenta direto e depois a CASCATA de proxies grátis (a mesma do extrator do Gemini, que funciona):
   AllOrigins → corsproxy.io → CodeTabs → AllOrigins (cru). Último recurso: leitor r.jina.ai (só o texto). */
(function (N) {
  const PROXIES = [
    { nome: 'AllOrigins', url: (u) => 'https://api.allorigins.win/get?url=' + encodeURIComponent(u), json: true },
    { nome: 'corsproxy.io', url: (u) => 'https://corsproxy.io/?' + encodeURIComponent(u) },
    { nome: 'CodeTabs', url: (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u) },
    { nome: 'AllOrigins (cru)', url: (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u) }
  ];
  let ultimoBom = N.pref.get('proxyBom', -1); // começa pelo que funcionou da última vez

  async function comTempo(url, ms, opcoes) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
    try { return await fetch(url, Object.assign({ signal: ctl.signal, redirect: 'follow' }, opcoes || {})); } finally { clearTimeout(t); }
  }
  const pareceHtml = (t) => typeof t === 'string' && t.length > 80;
  // lê o texto com os acentos certos (sites do governo às vezes usam ISO-8859-1)
  async function lerTexto(r) {
    const buf = await r.arrayBuffer(), bytes = new Uint8Array(buf);
    let cs = (/charset=([\w-]+)/i.exec(r.headers.get('content-type') || '') || [])[1];
    if (!cs) { const ini = new TextDecoder('latin1').decode(bytes.slice(0, 4096)); cs = (/<meta[^>]+charset=["']?([\w-]+)/i.exec(ini) || [])[1]; }
    cs = (cs || 'utf-8').toLowerCase();
    try { return new TextDecoder(cs === 'iso-8859-1' || cs === 'latin1' ? 'windows-1252' : cs, { fatal: false }).decode(bytes); }
    catch (e) { return new TextDecoder('utf-8').decode(bytes); }
  }

  // devolve { html, via, final }
  N.buscar = async function (url) {
    if (N.ehApk()) {
      N.estado('⏳ Abrindo direto (APK)…');
      const r = await comTempo(url, 25000);
      if (!r.ok) throw new Error('O site respondeu erro ' + r.status + '.');
      return { html: await lerTexto(r), via: 'direto (APK)', final: r.url || url };
    }
    // 1) direto (alguns sites deixam)
    try { const r = await comTempo(url, 7000); if (r.ok) { const t = await lerTexto(r); if (pareceHtml(t)) return { html: t, via: 'direto', final: r.url || url }; } } catch (e) {}
    // 2) cascata
    const ordem = PROXIES.map((p, i) => i); if (ultimoBom >= 0) { ordem.splice(ordem.indexOf(ultimoBom), 1); ordem.unshift(ultimoBom); }
    for (let k = 0; k < ordem.length; k++) {
      const i = ordem[k], p = PROXIES[i];
      N.estado('⏳ Tentando ' + (k + 1) + '/' + ordem.length + ': ' + p.nome + '…');
      try {
        const r = await comTempo(p.url(url), 15000); if (!r.ok) continue;
        let t;
        if (p.json) { try { const d = JSON.parse(await r.text()); t = d.contents || ''; } catch (e) { continue; } }
        else t = await lerTexto(r);
        if (pareceHtml(t)) { ultimoBom = i; N.pref.set('proxyBom', i); return { html: t, via: p.nome, final: url }; }
      } catch (e) {}
    }
    // 3) leitor (só o texto)
    N.estado('⏳ Tentando o leitor de texto…');
    try {
      const r = await comTempo('https://r.jina.ai/' + url, 25000, { headers: { 'x-return-format': 'html' } });
      if (r.ok) { const t = await r.text(); if (pareceHtml(t)) return { html: t, via: 'leitor r.jina.ai', final: url }; }
    } catch (e) {}
    throw new Error('Não consegui abrir esse site por nenhum caminho. Alguns sites (com Cloudflare ou login) bloqueiam tudo: use "↗ Abrir no Chrome". No APK isso costuma funcionar.');
  };

  // transforma o que foi digitado em endereço (ou pesquisa)
  N.endereco = function (t) {
    t = String(t || '').trim(); if (!t) return '';
    if (/^https?:\/\//i.test(t)) return t;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t) && !/\s/.test(t)) return 'https://' + t;
    return 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(t);
  };
})(window.N);
