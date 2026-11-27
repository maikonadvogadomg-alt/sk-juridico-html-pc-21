/* Estúdio de Histórias — 70-config.js: chave da IA e projeto. */
(function (H) {
  function mostrar() {
    const c = H.ia.config();
    H.$('#ia-prov').value = c.prov || 'gemini'; H.$('#ia-chave').value = c.chave || ''; H.$('#ia-modelo').value = c.modelo || ''; H.$('#ia-url').value = c.url || '';
    H.$('#ia-url').hidden = !/^(compat|ollama)$/.test(H.$('#ia-prov').value);
    H.$('#ia-proxy').checked = H.pref.get('proxyGratis', false);
    H.$('#tema').value = H.pref.get('tema', '');
  }
  H.$('#ia-prov').onchange = () => {
    const v = H.$('#ia-prov').value; H.$('#ia-url').hidden = !/^(compat|ollama)$/.test(v);
    H.$('#ia-url').placeholder = v === 'ollama' ? 'Endereço do Ollama (vazio = http://127.0.0.1:11434/v1)' : 'Endereço (só para "Outra"), ex.: https://api.deepseek.com/v1';
    H.$('#ia-chave').placeholder = v === 'ollama' ? 'O Ollama não precisa de chave' : 'Cole a chave aqui';
  };
  H.$('#ia-proxy').onchange = () => { H.pref.set('proxyGratis', H.$('#ia-proxy').checked); };
  H.aplicarTema = () => { const t = H.pref.get('tema', ''); if (t) document.documentElement.dataset.tema = t; else delete document.documentElement.dataset.tema; };
  H.$('#tema').onchange = () => { H.pref.set('tema', H.$('#tema').value); H.aplicarTema(); };
  H.aplicarTema();
  function gravar() { H.pref.set('ia', { prov: H.$('#ia-prov').value, chave: H.$('#ia-chave').value.trim(), modelo: H.$('#ia-modelo').value.trim(), url: H.$('#ia-url').value.trim() }); }
  H.$('#ia-salvar').onclick = () => { gravar(); H.$('#ia-msg').textContent = '✅ Salvo.'; };
  H.$('#ia-testar').onclick = async () => {
    gravar(); const m = H.$('#ia-msg'); m.textContent = '⏳ Testando…';
    try { const r = await H.ia.pedir('Responda só: ok', 'Diga ok.', false); m.textContent = '✅ Funcionou: ' + r.trim().slice(0, 40); }
    catch (e) { m.textContent = '❌ ' + e.message; }
  };
  H.on('aba', async (n) => {
    if (n !== 'config') return; mostrar();
    try { const e = await navigator.storage.estimate(); H.$('#espaco').textContent = 'Espaço usado por este app: ' + (e.usage / 1048576).toFixed(1) + ' MB'; } catch (e) {}
  });
  H.$('#bt-apagar-proj').onclick = async () => {
    const t = prompt('Para apagar o projeto "' + (H.p.titulo || 'sem nome') + '" com as gravações e imagens dele, escreva APAGAR:');
    if (!t || t.trim().toUpperCase() !== 'APAGAR') { H.aviso('Nada foi apagado.'); return; }
    for (const c of H.p.cenas) { await H.banco.apagarMidia(c.audioId); await H.banco.apagarMidia(c.audioOrigId); await H.banco.apagarMidia(c.imgId); }
    await H.banco.apagarProjeto(H.p.id); H.aviso('🗑 Projeto apagado.', 'ok');
    H.emit('recarregar');
  };
})(window.H);
