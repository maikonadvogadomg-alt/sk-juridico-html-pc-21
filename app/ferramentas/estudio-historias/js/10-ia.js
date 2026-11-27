/* Estúdio de Histórias — 10-ia.js: chama a IA (Gemini, Groq, OpenRouter ou compatível). */
(function (H) {
  const PADRAO = { gemini: 'gemini-2.5-flash', groq: 'llama-3.3-70b-versatile', openrouter: 'google/gemini-2.5-flash', monica: 'gpt-4o', ollama: 'llama3.1', compat: '' };
  const URLS = { groq: 'https://api.groq.com/openai/v1', openrouter: 'https://openrouter.ai/api/v1', monica: 'https://openapi.monica.im/v1', ollama: 'http://127.0.0.1:11434/v1' };
  // se o navegador bloquear (CORS): ponte do programa do PC e, se a pessoa ligou, o proxy grátis
  async function buscar(url, op) {
    try { return await fetch(url, op); }
    catch (e) {
      if (/127\.0\.0\.1|localhost|generativelanguage/.test(url)) throw e;
      if (location.hostname === '127.0.0.1') { try { const r = await fetch('/proxy/ia', Object.assign({}, op, { headers: Object.assign({}, op.headers, { 'x-destino': url }) })); if (r.status !== 404) return r; } catch (e2) {} }
      if (H.pref.get('proxyGratis', false)) return fetch('https://corsproxy.io/?' + encodeURIComponent(url), op);
      throw e;
    }
  }
  H.buscarIA = buscar;
  H.ia = {
    config() { return H.pref.get('ia', { prov: 'gemini', chave: '', modelo: '', url: '' }); },
    pronta() { const c = this.config(); if (c.prov === 'ollama') return true; return !!c.chave && (c.prov !== 'compat' || !!c.url); },
    async pedir(sistema, texto, json) {
      const c = this.config();
      if (!c.chave && c.prov !== 'ollama') throw new Error('Falta a chave da IA. Vá em ⚙️ Config e cole a chave.');
      const modelo = c.modelo || PADRAO[c.prov];
      let r;
      try {
        if (c.prov === 'gemini') {
          r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelo) + ':generateContent?key=' + encodeURIComponent(c.chave), {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ systemInstruction: { parts: [{ text: sistema }] }, contents: [{ role: 'user', parts: [{ text: texto }] }],
              generationConfig: Object.assign({ temperature: 0.8 }, json ? { responseMimeType: 'application/json' } : {}) })
          });
        } else {
          const base = ((c.prov === 'compat' || (c.prov === 'ollama' && c.url)) ? c.url : URLS[c.prov]).replace(/\/+$/, '');
          if (!modelo) throw new Error('Escreva o nome do modelo em ⚙️ Config.');
          r = await buscar(base + '/chat/completions', {
            method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, c.chave ? { authorization: 'Bearer ' + c.chave } : {}),
            body: JSON.stringify(Object.assign({ model: modelo, temperature: 0.8, messages: [{ role: 'system', content: sistema }, { role: 'user', content: texto }] },
              json && /^(groq|openrouter)$/.test(c.prov) ? { response_format: { type: 'json_object' } } : {}))
          });
        }
      } catch (e) {
        if (c.prov === 'ollama') throw new Error('Não achei o Ollama. Ele precisa estar ligado (no PC ou no Termux) com OLLAMA_ORIGINS=* .');
        throw new Error('Não consegui falar com a IA (internet ou bloqueio do navegador). ' + (c.prov === 'monica' ? 'A Monica bloqueia o navegador: ligue o 🔀 Proxy grátis em ⚙️ Config ou use o programa do PC.' : 'Confira a internet e tente de novo.'));
      }
      const txt = await r.text(); let d = null; try { d = JSON.parse(txt); } catch (e) {}
      if (!r.ok) {
        const m = (d && (d.error && (d.error.message || d.error))) || txt.slice(0, 200);
        if (r.status === 401 || r.status === 403) throw new Error('A chave foi recusada (' + r.status + '). Confira a chave em ⚙️ Config.');
        if (r.status === 429) throw new Error('A cota da IA acabou por agora (429). Espere um pouco ou use outra chave.');
        throw new Error('A IA respondeu com erro ' + r.status + ': ' + (typeof m === 'string' ? m : JSON.stringify(m)).slice(0, 200));
      }
      const saida = c.prov === 'gemini'
        ? ((d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || []).map((p) => p.text || '').join('')
        : (d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
      if (!saida.trim()) throw new Error('A IA respondeu vazio. Tente de novo.');
      return saida;
    },
    // tira o JSON de dentro da resposta, mesmo se vier com texto em volta
    lerJSON(t) {
      t = String(t || '').replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
      try { return JSON.parse(t); } catch (e) {}
      const i = t.indexOf('{'), f = t.lastIndexOf('}');
      if (i >= 0 && f > i) { try { return JSON.parse(t.slice(i, f + 1)); } catch (e) {} }
      throw new Error('A IA não devolveu o roteiro no formato certo. Toque em "Fazer o roteiro" de novo.');
    }
  };
})(window.H);
