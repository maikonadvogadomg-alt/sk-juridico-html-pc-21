/* =========================================================================
   Assistente Jurídico — 70-ferramentas.js
   🧰 As ferramentas que já funcionam, cada uma no seu arquivo (ferramentas/),
   abertas aqui dentro. Ficam "vivas": trocar de aba não apaga o que estava
   sendo feito nelas.
   ========================================================================= */
(function (J) {
  'use strict';
  const LISTA = [
    { id: 'navegador', arq: 'navegador-sk/index.html', nome: '🌐 Navegador SK (ler e traduzir sites)', d: 'Abre sites aqui dentro (tribunais, leis, artigos), com 📖 modo leitura (só o texto) e 🇧🇷 tradução para o português. Guarda páginas no aparelho, baixa o texto já traduzido. Busca pela cascata de proxies grátis; no APK abre direto.' },
    { id: 'estudio', arq: 'estudio-historias/index.html', nome: '🎬 Estúdio de Histórias (vídeos dos casos)', d: 'Conte um caso e ele faz o roteiro (com sigilo: troca nomes), a voz (sua, Francisco ou da IA), as imagens, a música e o vídeo pronto para YouTube, Shorts e Reels. Tem teleprompter para gravar com a sua voz.' },
    { id: 'testar-ia', arq: 'testar-ia.html', nome: '🔌 Testar chave de IA (Monica e outras)', d: 'Descobre por que uma chave não funciona: chave errada, sem crédito, modelo que não existe ou o navegador bloqueando (CORS). Faz 3 testes e diz o motivo em português. A chave não é guardada.' },
    { id: 'desmontador', arq: 'desmontador-codigo.html', nome: '🧪 Laboratório: mudar e desmontar', d: 'Abra um código, toque numa parte e mude na hora: cor, tamanho, ângulo, abrir e fechar, esconder, duplicar, trocar o texto. Baixe o código mudado. Também separa peças (com o CSS e as funções certas) e junta peças de vários códigos.' },
    { id: 'organizador', arq: 'organizador-codigos.html', nome: '🗂 Organizador de Códigos', d: 'Jogue vários códigos ou zips: ele diz o que cada um faz, mostra a % de semelhança, junta os parecidos e separa os repetidos num ZIP organizado. Sem IA e sem apagar nada.' },
    { id: 'netlify', arq: 'versao-netlify.html', nome: '🌐 Minha versão no Netlify', d: 'Abre aqui dentro a sua versão jurídica antiga publicada no Netlify (a que já funciona, com as suas regras e prompts). Cole o link uma vez e ele fica guardado.' },
    { id: 'transcrever', arq: 'transcrever.html', nome: '🎙 Transcrever Áudio (WhatsApp)', d: 'Áudios do WhatsApp viram texto LITERAL com o tempo de cada trecho, para usar como prova. Junta a ficha do arquivo (tamanho, duração, data e a impressão digital SHA-256). Baixa em Word.' },
    { id: 'aistudio', arq: 'ai-studio/index.html', nome: '⚡ AI Studio (chat rápido e econômico)', d: 'O chat mais leve: responde mais rápido e gasta menos (Gemini, Groq, OpenRouter, Monica, Ollama). Selecione um texto no Jurídico antes de abrir e ele já vai para a caixa do chat. Tem as ferramentas de imagem, Markdown, dividir/juntar e envio em partes.' },
    { id: 'meuchat', arq: 'meu-chat/index.html', nome: '💬 Meu Chat (chat livre)', d: 'O seu chat completo, separado do jurídico: não gasta o pedido das peças. Mesmo login da ☁️ nuvem.' },
    { id: 'desmontador', arq: 'desmontador-backup.html', nome: '♻️ Restaurador Universal', d: 'Escolha backups de qualquer app seu (.json, .zip, .csv, .tsv): descobre o que é, mostra ao vivo, devolve no formato original e restaura aqui. Uma peça por tipo: seus apps, projetos da Replit, AI Code Studio, ChatGPT.' },
    { id: 'banco', arq: 'banco-neon.html', nome: '🗄 Banco de Dados (Neon)', d: 'Cole o endereço do Neon: veja as tabelas e o que tem dentro, baixe tudo (backup) e crie tabelas. Comando que apaga pede CONFIRMO.' },
    { id: 'verificador', arq: 'verificador-citacoes.html', nome: '🔎 Verificador de Citações', d: 'Cole o texto da IA: marca julgado inventado (número de exemplo, dígito do CNJ que não confere, súmula que não existe, relator sem nome) e dá os links para conferir.' },
    { id: 'calculadora', arq: 'calculadora-sentenca.html', nome: '🧮 Calculadora da Sentença (completa)', d: 'Mês a mês pela sentença: tabela oficial do TJMG embutida (ou colada de qualquer jeito, até do Cálculo Jurídico), qualquer série do Banco Central (ao ano ou ao mês), capitalização anual, os 4 modelos de honorários e os recursais. Parecer com resumo, fontes, links e análise do cálculo da outra parte.' },
    { id: 'montador', arq: 'montador.html', nome: '🧩 Montador Universal (+ 🤖 regra com IA)', d: 'Abre qualquer arquivo (PDF, Excel, CSV, JSON, texto), você cria as regras tocando nas linhas e baixa no formato que quiser. 🤖 A IA escreve a regra uma vez; depois ele aplica sozinho, sem gastar IA. Guarda modelos.' },
    { id: 'raiox', arq: 'raio-x-zip.html', nome: '🩻 Raio-X de ZIP (zip gigante)', d: 'Abre zip enorme (até zip dentro de zip) sem descompactar tudo e sem travar. Gera o PLANO do projeto (rotas, APIs, pastas, manuais) e um ZIP pequeno com os arquivos importantes — senhas e chaves saem tampadas.' },
    { id: 'datajud', arq: 'datajud.html', nome: '📡 Processos (DataJud/CNJ) e 🔎 Jurisprudência na fonte', d: 'Digite o número do processo e veja as movimentações direto do CNJ (grátis). ⭐ Acompanhe vários e toque em "Ver novidades" para saber o que mudou. E pesquise jurisprudência abrindo a busca OFICIAL do STJ, STF, TJMG e CNJ com os seus termos.' },
    { id: 'modelo', arq: 'montador-simples.html', nome: '🎯 Igualar a um modelo (Montador Simples)', d: 'Você cola um arquivo MODELO (ex.: o CSV baixado do site do Bacen) e a tabela que tem (ex.: TJMG). Ele aprende o formato do modelo — separador, data, decimal, cabeçalho, rodapé — e entrega igual. Também limpa texto de PDF e transforma backup/JSON em tabela.' },
    { id: 'conversor', arq: 'conversor-indices.html', nome: '📈 Conversor de Índices → Bacen', d: 'Qualquer tabela de índices (TJMG, IBGE, PDF, Excel, Cálculo Jurídico) sai no formato do Banco Central: data;valor, mês a mês. Com memória de cálculo para conferir um valor.' },
    { id: 'perito', arq: 'perito.html', nome: '🔬 Perito de Metadados', d: 'Perícia em PDF/foto: autor, datas, programas, sinais de montagem. Gera relatório de apoio com resumo em palavras simples, em Word ou PDF.' },
    { id: 'comunicacoes', arq: 'comunicacoes.html', nome: '📬 Comunicações (DJEN) + 🤖 Robô de prazos', d: '🤖 Acha sessão virtual, calcula o prazo de sustentação oral e prepara o aviso ao cliente (e-mail/WhatsApp). Intimações e publicações do Diário de Justiça Eletrônico Nacional.' },
    { id: 'limpador', arq: 'limpador.html', nome: '🧹 Limpador de Processos', d: 'Tira a sujeira do PDF do processo (assinaturas, rodapé do PJe, links…). NOVO: 📑 índice das peças (sentença, acórdão, decisão, petição…) — deixe só as decisões e até o Ollama dá conta de processo enorme; ✍️ cria a regra a partir de uma linha de exemplo, sem saber regex. Depois divide em partes e resume com IA grátis.' },
    { id: 'organizador', arq: 'organizador.html', nome: '📑 Organizador de Documentos', d: 'Importa o PDF, mostra tudo numerado e organizado, e baixa no padrão que você criar.' },
    { id: 'juntador', arq: 'juntador.html', nome: '🧩 Juntador de Arquivos', d: 'Junta vários arquivos (Word, texto, até .zip) num texto só — bom para mandar tudo à IA de uma vez.' },
    { id: 'extrator', arq: 'extrator.html', nome: '🌐 Extrator de Sites', d: 'Cole o endereço de uma página pública e puxe o texto inteiro (ex.: uma decisão publicada).' },
    { id: 'colador', arq: 'colador.html', nome: '🔗 Colador de Links', d: 'Seus links e os dos tribunais (TJMG, TRF6, STJ, Meu INSS…) num lugar só. Também guarda códigos.' },
    { id: 'laboratorio', arq: 'laboratorio.html', nome: '🧪 Laboratório HTML', d: 'Toque numa parte da página e mude cor, tamanho, espaço. Com aulas de HTML e CSS.' },
    { id: 'colecionador', arq: 'colecionador.html', nome: '🧰 Colecionador de Comandos', d: 'Guarda os comandos com explicação. Cole a resposta da IA e ele separa sozinho.' },
    { id: 'cacabug', arq: 'cacabug/index.html', nome: '🐞 Caça-Bug', d: 'Acha e conserta erros nos seus códigos e projetos.' },
    { id: 'comparador', arq: 'comparador.html', nome: '⚖️ Comparador de Versões', d: 'Compara duas ou várias versões de um projeto e junta o que falta.' },
  ];
  let painel, quadro;
  const vivos = new Map();

  function montar(el) {
    painel = el;
    el.innerHTML = '<h2>🧰 Ferramentas</h2><p class="peq mut">Abrem aqui dentro, em tela cheia. Toque em ← Voltar para voltar ao Assistente — a ferramenta continua aberta do jeito que você deixou.</p>' +
      '<h3 style="margin:10px 0 6px">⭐ Meus códigos</h3><p class="peq mut">Coloque aqui os seus códigos pequenos (.html) que já funcionam. Com a conta no Neon (e-mail e senha), eles ficam <b>na nuvem</b> e abrem em qualquer aparelho. Sem conta, ficam neste aparelho.</p>' +
      '<div class="grade" id="fr-meus"></div><p><label class="bt">➕ Adicionar meus códigos (.html)<input type="file" id="fr-add" accept=".html,.htm" multiple hidden></label></p>' +
      '<h3 style="margin:14px 0 6px">🧰 Ferramentas do jurídico</h3>' +
      '<div class="grade">' + LISTA.map((f) => '<button class="ferr" data-f="' + f.id + '"><b>' + f.nome + '</b><span>' + f.d + '</span></button>').join('') + '</div>' +
      '<div class="caixa" style="margin-top:14px">A chave do Gemini que você colocou em ⚙️ Config já vai junto para o 🧹 Limpador.</div>';
    quadro = document.createElement('div'); quadro.className = 'quadro-ferr'; quadro.hidden = true;
    quadro.innerHTML = '<div class="barra"><button class="bt mini" id="fr-voltar">← Voltar</button><b id="fr-nome"></b><button class="bt mini" id="fr-recarregar" title="Recarregar">⟳</button><button class="bt mini" id="fr-fora" title="Abrir fora">↗</button></div>';
    document.body.appendChild(quadro);
    el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tirar-meu]'); if (t) { e.stopPropagation(); if (confirm('Tirar "' + t.dataset.nome + '" da lista? (o seu arquivo original não é apagado)')) meus.tirar(t.dataset.tirarMeu).then(pintarMeus); return; }
      const m = e.target.closest('[data-meu]'); if (m) { abrirMeu(m.dataset.meu); return; }
      const b = e.target.closest('[data-f]'); if (b) abrir(b.dataset.f);
    });
    J.$('#fr-add').onchange = async (e) => {
      for (const f of [...e.target.files]) { try { await meus.guardar({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nome: f.name.replace(/\.html?$/i, ''), html: lerTexto(await f.arrayBuffer()), criado: Date.now() }); } catch (er) { J.aviso(f.name + ': ' + er.message, 'erro'); } }
      e.target.value = ''; pintarMeus(); J.aviso('⭐ Guardado em Meus códigos.', 'ok');
    };
    pintarMeus(); if (J.on) J.on('nuvem', () => setTimeout(pintarMeus, 300));
    J.$('#fr-voltar').onclick = () => { quadro.hidden = true; document.body.style.overflow = ''; };
    J.$('#fr-recarregar').onclick = () => { const f = vivos.get(quadro.dataset.atual); if (f) { if (f.srcdoc) f.srcdoc = f.srcdoc; else f.src = f.src; } };
    J.$('#fr-fora').onclick = async () => { const a = quadro.dataset.atual || ''; if (a.startsWith('meu:')) { const m = await meus.pegar(a.slice(4)); if (m) window.open(URL.createObjectURL(new Blob([m.html], { type: 'text/html;charset=utf-8' })), '_blank'); return; } const it = LISTA.find((x) => x.id === a); if (it) window.open('ferramentas/' + it.arq, '_blank'); };
  }
  // ⭐ 26/11: MEUS CÓDIGOS — os códigos pequenos do Maikon, guardados no aparelho (IndexedDB) e abertos aqui dentro
  const meus = (() => {
    const abre = () => new Promise((ok, erro) => { const r = indexedDB.open('sk-meus-codigos', 1); r.onupgradeneeded = () => r.result.createObjectStore('codigos', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); });
    const tx = async (modo, fn) => { const db = await abre(); return new Promise((ok, erro) => { const t = db.transaction('codigos', modo), st = t.objectStore('codigos'); const r = fn(st); t.oncomplete = () => ok(r && r.result); t.onerror = () => erro(t.error); }); };
    const local = { todos: () => tx('readonly', (st) => st.getAll()), guardar: (o) => tx('readwrite', (st) => st.put(o)), tirar: (id) => tx('readwrite', (st) => st.delete(id)), pegar: (id) => tx('readonly', (st) => st.get(id)) };
    // 🐘 26/11-E: entrou com a conta no Neon → os seus códigos ficam NA NUVEM (tabela jur_ferramentas): abre em qualquer aparelho
    const nuvem = () => !!(J.conta && J.conta.ativa() && J.conta.sessao());
    return {
      async todos() { if (!nuvem()) return local.todos(); const l = await J.conta.lista('ferramentas'); const aqui = await local.todos().catch(() => []); for (const m of aqui) { if (!l.some((x) => x.id === m.id)) { try { await J.conta.grava('ferramentas', [{ id: m.id, dados: m, atualizado: m.criado || Date.now() }]); l.push(m); await local.tirar(m.id); } catch (e) { l.push(m); } } } return l; },
      async guardar(o) { if (!nuvem()) return local.guardar(o); await J.conta.grava('ferramentas', [{ id: o.id, dados: o, atualizado: Date.now() }]); },
      async tirar(id) { if (!nuvem()) return local.tirar(id); await J.conta.grava('ferramentas', [{ id, apagado: true, atualizado: Date.now() }]); await local.tirar(id).catch(() => {}); },
      async pegar(id) { if (!nuvem()) return local.pegar(id); return (await J.conta.pega('ferramentas', id)) || (await local.pegar(id).catch(() => null)); },
    };
  })();
  function lerTexto(buf) { let b = new Uint8Array(buf); if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.subarray(3); try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return new TextDecoder('windows-1252').decode(b); } }
  async function pintarMeus() {
    const caixa = J.$('#fr-meus'); if (!caixa) return;
    let l = []; try { l = (await meus.todos()) || []; } catch (e) {}
    l.sort((a, b) => a.nome.localeCompare(b.nome));
    caixa.innerHTML = l.length ? l.map((m) => '<div class="ferr" style="position:relative" data-meu="' + J.esc(m.id) + '" role="button" tabindex="0"><b>⭐ ' + J.esc(m.nome) + '</b><span>' + Math.round(m.html.length / 1024) + ' KB · guardado em ' + new Date(m.criado).toLocaleDateString('pt-BR') + ((J.conta && J.conta.sessao()) ? ' · ☁️ na nuvem' : ' · 📱 neste aparelho') + '</span><button class="bt mini" style="position:absolute;top:6px;right:6px" data-tirar-meu="' + J.esc(m.id) + '" data-nome="' + J.esc(m.nome) + '" title="Tirar da lista">✖</button></div>').join('') : '<p class="peq mut">Nenhum ainda.</p>';
  }
  async function abrirMeu(id) {
    const m = await meus.pegar(id); if (!m) return;
    const chave = 'meu:' + id;
    quadro.dataset.atual = chave; J.$('#fr-nome').textContent = '⭐ ' + m.nome;
    vivos.forEach((f, k) => (f.hidden = k !== chave));
    if (!vivos.has(chave)) {
      const f = document.createElement('iframe'); f.title = m.nome;
      f.setAttribute('allow', 'clipboard-read; clipboard-write; microphone; camera; fullscreen; autoplay; screen-wake-lock');
      f.srcdoc = m.html; quadro.appendChild(f); vivos.set(chave, f);
    }
    quadro.hidden = false; document.body.style.overflow = 'hidden';
  }
  function passarChave() {
    const c = J.ia.cfg(); if (!c.chave) return;
    try { const k = 'limpador:chaves'; const ch = JSON.parse(localStorage.getItem(k) || '{}'); if (!ch.gemini) { ch.gemini = c.chave; localStorage.setItem(k, JSON.stringify(ch)); } } catch {}
    // o Estúdio de Histórias já começa com a chave do Gemini do jurídico (se ele ainda não tiver uma)
    try { if (!localStorage.getItem('historias:ia')) localStorage.setItem('historias:ia', JSON.stringify({ prov: 'gemini', chave: c.chave, modelo: '', url: '' })); } catch {}
  }
  function abrir(id) {
    const it = LISTA.find((x) => x.id === id); if (!it) return;
    passarChave();
    quadro.dataset.atual = id; J.$('#fr-nome').textContent = it.nome;
    vivos.forEach((f, k) => (f.hidden = k !== id));
    if (!vivos.has(id)) {
      const f = document.createElement('iframe');
      f.src = 'ferramentas/' + it.arq; f.title = it.nome;
      f.setAttribute('allow', 'clipboard-read; clipboard-write; microphone; camera; fullscreen; autoplay; screen-wake-lock');
      f.addEventListener('load', () => { f.dataset.pronto = '1'; });
      quadro.appendChild(f); vivos.set(id, f);
    }
    quadro.hidden = false; document.body.style.overflow = 'hidden';
    if (id === 'aistudio' && ultimaSel.t && Date.now() - ultimaSel.q < 10 * 60000) { mandarAIStudio(ultimaSel.t, true); ultimaSel.t = ''; }
  }
  // 📤 25/11: texto selecionado no Jurídico vai para a caixa do chat do ⚡ AI Studio
  const ultimaSel = { t: '', q: 0 };
  document.addEventListener('selectionchange', () => { try { const t = String(window.getSelection() || '').trim(); if (t.length >= 15) { ultimaSel.t = t; ultimaSel.q = Date.now(); } } catch (e) {} });
  function mandarAIStudio(texto, jaAberto) {
    if (!jaAberto) abrir('aistudio');
    const f = vivos.get('aistudio'); if (!f || !texto) return;
    const enviar = () => { try { f.contentWindow.postMessage({ paraAIStudio: texto }, '*'); } catch (e) {} };
    if (f.dataset.pronto) enviar(); else f.addEventListener('load', () => { f.dataset.pronto = '1'; setTimeout(enviar, 600); }, { once: true });
  }
  J.ferramentas = { LISTA, abrir, mandarAIStudio };
  J.registrar({ aba: 'ferramentas', montar });
})(window.J);
