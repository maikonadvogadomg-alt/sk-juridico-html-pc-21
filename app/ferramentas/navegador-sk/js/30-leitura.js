/* Navegador SK — 30-leitura.js: tira só o texto principal da página (modo leitura). */
(function (N) {
  N.lerPrincipal = function (doc, url) {
    const d = doc.cloneNode(true);
    d.querySelectorAll('script,style,noscript,iframe,svg,form,nav,footer,header,aside,button,input,select,[role=navigation],[aria-hidden=true],.cookie,.cookies,.banner,.menu,.sidebar').forEach((e) => e.remove());
    // o bloco com mais texto em parágrafos
    let melhor = d.querySelector('article') || d.querySelector('main') || null, nota = 0;
    if (!melhor) d.querySelectorAll('div,section').forEach((el) => {
      const ps = el.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > table, :scope > h2, :scope > h3');
      let t = 0; ps.forEach((p) => { t += (p.textContent || '').trim().length; });
      if (t > nota) { nota = t; melhor = el; }
    });
    if (!melhor || (melhor.textContent || '').trim().length < 200) melhor = d.body || d;
    const titulo = (doc.querySelector('title') || {}).textContent || '';
    const out = document.createElement('div');
    const PERMIT = /^(P|H1|H2|H3|H4|UL|OL|LI|TABLE|THEAD|TBODY|TR|TD|TH|BLOCKQUOTE|STRONG|B|EM|I|A|BR|IMG|FIGCAPTION|SPAN|DIV|SECTION)$/;
    function limpa(no, destino) {
      no.childNodes.forEach((c) => {
        if (c.nodeType === 3) { destino.appendChild(document.createTextNode(c.nodeValue)); return; }
        if (c.nodeType !== 1) return;
        if (!PERMIT.test(c.tagName)) { limpa(c, destino); return; }
        const tag = /^(SPAN|DIV|SECTION)$/.test(c.tagName) ? (c.tagName === 'SPAN' ? 'span' : 'div') : c.tagName.toLowerCase();
        const e = document.createElement(tag);
        if (tag === 'a') { try { e.href = new URL(c.getAttribute('href') || '', url).href; } catch (x) {} }
        if (tag === 'img') { try { e.src = new URL(c.getAttribute('src') || '', url).href; e.alt = c.getAttribute('alt') || ''; e.loading = 'lazy'; } catch (x) { return; } }
        limpa(c, e);
        if (tag === 'div' && !(e.textContent || '').trim() && !e.querySelector('img')) return;
        destino.appendChild(e);
      });
    }
    limpa(melhor, out);
    return { titulo: titulo.trim(), html: out.innerHTML, texto: (out.innerText || out.textContent || '').replace(/\n{3,}/g, '\n\n').trim() };
  };
})(window.N);
