/* Navegador SK — 20-traducao.js: traduz para o português, de graça (tradutor do Google), mantendo a página. */
(function (N) {
  const cache = new Map();
  async function tradTexto(t) {
    if (cache.has(t)) return cache.get(t);
    const u = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=' + encodeURIComponent(t);
    let r;
    try { r = await fetch(u); } catch (e) { throw new Error('O tradutor não respondeu (internet?).'); }
    if (!r.ok) throw new Error('O tradutor recusou (' + r.status + '). Tente daqui a pouco.');
    const d = await r.json();
    const out = (d && d[0] || []).map((x) => x && x[0] || '').join('');
    cache.set(t, out); return out;
  }
  // traduz uma lista de textos em pacotes (separados por linha); se o pacote não bater, traduz um a um
  N.traduzirLista = async function (lista, progresso) {
    const res = new Array(lista.length); let i = 0, feitos = 0;
    while (i < lista.length) {
      const grupo = []; let tam = 0;
      while (i < lista.length && (tam + lista[i].length < 1500 || !grupo.length)) { grupo.push(i); tam += lista[i].length + 1; i++; }
      const junto = grupo.map((k) => lista[k].replace(/\n+/g, ' ')).join('\n');
      let partes = null;
      try { partes = (await tradTexto(junto)).split('\n'); } catch (e) { throw e; }
      if (partes.length === grupo.length) grupo.forEach((k, j) => { res[k] = partes[j]; });
      else for (const k of grupo) res[k] = await tradTexto(lista[k]);
      feitos += grupo.length; if (progresso) progresso(feitos, lista.length);
    }
    return res;
  };
  // traduz os textos de um documento (DOM) no lugar
  N.traduzirDoc = async function (doc, progresso) {
    const nos = [], w = doc.createTreeWalker(doc.body || doc, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        const p = n.parentElement; if (!p) return NodeFilter.FILTER_REJECT;
        if (/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE|TEXTAREA)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
        return /[A-Za-zÀ-ÿ]{2}/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let n; while ((n = w.nextNode())) nos.push(n);
    const textos = nos.map((x) => x.nodeValue.trim()).filter(Boolean);
    const alvo = nos.filter((x) => x.nodeValue.trim());
    if (!textos.length) return 0;
    const trad = await N.traduzirLista(textos, progresso);
    alvo.forEach((x, k) => { const ini = /^\s/.test(x.nodeValue) ? ' ' : '', fim = /\s$/.test(x.nodeValue) ? ' ' : ''; if (trad[k]) x.nodeValue = ini + trad[k] + fim; });
    return textos.length;
  };
})(window.N);
