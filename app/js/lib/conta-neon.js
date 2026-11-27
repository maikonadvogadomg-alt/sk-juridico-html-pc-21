/* =========================================================================
   SK Jurídico HTML — lib/conta-neon.js · 🐘 CONTA NO NEON (26/11)
   IGUAL À REPLIT: e-mail + senha em qualquer aparelho → tudo está lá.
   • Nada de colar endereço: ele vem embutido (js/conta-neon-embutida.js), com um usuário LIMITADO.
   • Nada de subir e descer: cada coisa é lida e gravada DIRETO no banco (não guarda cópia no aparelho).
   • Uma TABELA FIXA para cada coisa: jur_config, jur_chaves, jur_documentos, jur_modelos, jur_ementas,
     jur_historico, jur_conversas, jur_regras, jur_codigos, jur_ferramentas (⭐ Meus códigos) (+ sk_usuarios e sk_sessoes para o login).
   • A senha do login vira um "embaralhado" (bcrypt) dentro do banco: ninguém lê.
   • As chaves das IAs vão TRANCADAS com a sua senha (o banco guarda só o cadeado).
   ========================================================================= */
(function (J) {
  'use strict';
  const CN = window.CONTA_NEON || {};
  const LOJAS = ['config', 'chaves', 'documentos', 'modelos', 'ementas', 'historico', 'conversas', 'regras', 'codigos', 'clientes', 'publicacoes', 'ferramentas'];
  const PREFS = ['perfil', 'esforco', 'tamanho', 'doisPassos', 'lembrarHist', 'internet', 'internetConversa', 'lerRespostas', 'timbrados', 'timbradoAtivo', 'djen:clientes', 'djen:vistos', 'djen:lidas'];
  const KS = 'sk:conta:sessao';
  const ativa = () => !!(CN.host && CN.usuario && CN.senha);
  const conn = () => 'postgresql://' + CN.usuario + ':' + encodeURIComponent(CN.senha) + '@' + CN.host + '/' + (CN.banco || 'neondb') + '?sslmode=require';
  function sessao() { try { return JSON.parse(localStorage.getItem(KS) || 'null'); } catch (e) { return null; } }
  function guardarSessao(s) { try { localStorage.setItem(KS, JSON.stringify(s)); } catch (e) {} }
  let senhaMem = '';

  function traduzir(e) {
    const t = String((e && e.message) || e);
    if (/LOGIN_ERRADO/.test(t)) return new Error('E-mail ou senha errados.');
    if (/EMAIL_JA_EXISTE/.test(t)) return new Error('Esse e-mail já tem conta. Toque em 🔑 Entrar.');
    if (/SENHA_CURTA/.test(t)) return new Error('A senha precisa de pelo menos 6 letras/números.');
    if (/SESSAO_INVALIDA/.test(t)) { guardarSessao(null); return new Error('A sua entrada venceu. Entre de novo com e-mail e senha.'); }
    if (/function sk_\w+.*does not exist|42883/.test(t)) return new Error('O banco ainda não foi preparado. Toque em "⚙ 1ª vez: preparar o banco" (uma vez só).');
    if (/password authentication failed|28P01/.test(t)) return new Error('O banco ainda não foi preparado (o usuário do app não existe lá). Toque em "⚙ 1ª vez: preparar o banco".');
    return e instanceof Error ? e : new Error(t);
  }
  async function chamar(fn, args) {
    const ph = args.map((_, i) => '$' + (i + 1)).join(', ');
    try { const l = await NuvemNeon.consulta(conn(), 'select ' + fn + '(' + ph + ') as r', args); return l && l[0] ? l[0].r : null; }
    catch (e) { throw traduzir(e); }
  }
  const token = () => { const s = sessao(); if (!s || !s.token) throw new Error('Entre com e-mail e senha.'); return s.token; };

  // ── dados ──
  async function lista(loja) { const r = await chamar('sk_lista', [token(), loja]); return (Array.isArray(r) ? r : []).filter(Boolean); }
  async function pega(loja, id) { return await chamar('sk_pega', [token(), loja, String(id)]); }
  async function grava(loja, linhas) {
    const l = linhas.map((x) => ({ id: String(x.id), titulo: x.dados ? String(x.dados.titulo || x.dados.nome || '').slice(0, 300) : '', dados: x.apagado ? null : x.dados, apagado: !!x.apagado, atualizado: x.atualizado || Date.now() }));
    for (let i = 0; i < l.length; i += 25) await chamar('sk_grava', [token(), loja, JSON.stringify(l.slice(i, i + 25))]);
  }

  // ── configurações (inclui os seus modelos do Word e o robô) ──
  let aplicando = false, tPref = null;
  async function trazerPrefs() {
    const d = await pega('config', 'prefs'); if (!d || !d.valores) return 0; aplicando = true; let n = 0;
    try { for (const [k, v] of Object.entries(d.valores)) if (PREFS.includes(k)) { J.pref.set(k, v); n++; } } finally { aplicando = false; }
    return n;
  }
  async function mandarPrefs() { const o = {}; PREFS.forEach((k) => { const v = J.pref.get(k, undefined); if (v !== undefined) o[k] = v; }); await grava('config', [{ id: 'prefs', dados: { id: 'prefs', titulo: 'Configurações', valores: o }, atualizado: Date.now() }]); }
  // ── chaves das IAs: TRANCADAS com a sua senha ──
  const b64 = (u8) => btoa(String.fromCharCode(...new Uint8Array(u8)));
  const deB64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
  async function cadeado(senha, email) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode('sk-juridico-neon:' + email), iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function trazerChaves(senha, email) {
    if (!window.crypto || !crypto.subtle) return '';
    const k = await cadeado(senha, email), aqui = J.pref.get('ia', {}) || {}; let trouxe = 0;
    const d = await pega('chaves', 'ia').catch(() => null);
    if (d && d.iv) {
      try { const nuvem = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(d.iv) }, k, deB64(d.cifra)))); for (const [c, v] of Object.entries(nuvem || {})) if (v && (aqui[c] === undefined || aqui[c] === '')) { aqui[c] = v; trouxe++; } if (trouxe) { aplicando = true; try { J.pref.set('ia', aqui); } finally { aplicando = false; } } }
      catch (e) { return 'As chaves guardadas estão trancadas com outra senha.'; }
    }
    await mandarChaves(senha, email).catch(() => {});
    return trouxe ? '🔐 As chaves das IAs vieram junto.' : '';
  }
  async function mandarChaves(senha, email) {
    const aqui = J.pref.get('ia', {}) || {};
    if (!senha || !Object.values(aqui).some((v) => typeof v === 'string' && v.length > 15)) return;
    const k = await cadeado(senha, email), iv = crypto.getRandomValues(new Uint8Array(12));
    const cifra = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(aqui)));
    await grava('chaves', [{ id: 'ia', dados: { id: 'ia', titulo: 'Chaves das IAs (trancadas)', iv: b64(iv), cifra: b64(cifra), trancado: true }, atualizado: Date.now() }]);
  }
  function ganchoPrefs() {
    const set0 = J.pref.set; let tCh = null;
    J.pref.set = (k, v) => {
      set0(k, v);
      if (aplicando || !sessao()) return;
      if (PREFS.includes(k)) { clearTimeout(tPref); tPref = setTimeout(() => mandarPrefs().catch(() => {}), 900); }
      if (k === 'ia' && senhaMem) { clearTimeout(tCh); tCh = setTimeout(() => mandarChaves(senhaMem, sessao().email).catch(() => {}), 1200); }
    };
  }

  // ── entrar / criar / sair ──
  async function entrar(email, senha, criar) {
    email = String(email || '').trim().toLowerCase();
    if (!email || !senha) throw new Error('Escreva o e-mail e a senha.');
    const t = await chamar(criar ? 'sk_criar_conta' : 'sk_entrar', [email, senha]);
    if (!t) throw new Error('O banco não respondeu. Tente de novo.');
    guardarSessao({ token: t, email, desde: Date.now() }); senhaMem = senha;
    let avisos = [];
    try { const n = await trazerPrefs(); if (n) avisos.push('⚙️ configurações e modelos do Word vieram junto'); else await mandarPrefs(); } catch (e) {}
    try { const c = await trazerChaves(senha, email); if (c) avisos.push(c); } catch (e) {}
    if (J.online && J.online.limpaCache) LOJAS.forEach((l) => J.online.limpaCache(l));
    setTimeout(() => J.emit && J.emit('nuvem', 1), 0);
    return { ok: true, avisos };
  }
  async function sair() { const s = sessao(); if (s) { try { await chamar('sk_sair', [s.token]); } catch (e) {} } guardarSessao(null); senhaMem = ''; }
  async function trocarSenha(atual, nova) { const s = sessao(); await chamar('sk_trocar_senha', [token(), atual, nova]); senhaMem = nova; await mandarChaves(nova, s.email).catch(() => {}); }
  async function trazerAntigos() { const r = await chamar('sk_trazer_mc_itens', [token()]); (LOJAS).forEach((l) => J.online && J.online.limpaCache && J.online.limpaCache(l)); return r || 0; }
  async function minhaConta() { return await chamar('sk_conta', [token()]); }

  // ── ⚙ PREPARAR O BANCO (uma vez só, com o endereço do DONO, que NÃO é guardado) ──
  const T = (l) => "create table if not exists jur_" + l + " (usuario_id uuid not null references sk_usuarios(id) on delete cascade, id text not null, titulo text, dados jsonb, apagado boolean not null default false, atualizado bigint not null default 0, criado timestamptz not null default now(), primary key (usuario_id, id))";
  const DEF = 'language plpgsql security definer set search_path = public, pg_temp as $f$';
  const SQL = [
    'create extension if not exists pgcrypto',
    "create table if not exists sk_usuarios (id uuid primary key default gen_random_uuid(), email text unique not null, senha_hash text not null, dono boolean not null default false, criado timestamptz not null default now(), ultimo_acesso timestamptz)",
    "create table if not exists sk_sessoes (token text primary key, usuario_id uuid not null references sk_usuarios(id) on delete cascade, criado timestamptz not null default now(), ultimo timestamptz not null default now())",
  ].concat(LOJAS.map(T)).concat(LOJAS.map((l) => 'create index if not exists jur_' + l + '_atual on jur_' + l + ' (usuario_id, atualizado desc)')).concat([
    "create or replace function sk_tabela(p_loja text) returns text language sql immutable as $f$ select case when p_loja = any(array['" + LOJAS.join("','") + "']) then 'jur_' || p_loja end $f$",
    "create or replace function sk_usuario(p_token text) returns uuid " + DEF + " declare u uuid; begin select usuario_id into u from sk_sessoes where token = p_token; if u is null then raise exception 'SESSAO_INVALIDA'; end if; update sk_sessoes set ultimo = now() where token = p_token and ultimo < now() - interval '5 minutes'; return u; end $f$",
    "create or replace function sk_criar_conta(p_email text, p_senha text) returns text " + DEF + " declare u uuid; t text; primeiro boolean; begin p_email := lower(trim(p_email)); if length(coalesce(p_senha, '')) < 6 then raise exception 'SENHA_CURTA'; end if; if exists (select 1 from sk_usuarios where email = p_email) then raise exception 'EMAIL_JA_EXISTE'; end if; primeiro := not exists (select 1 from sk_usuarios); insert into sk_usuarios (email, senha_hash, dono, ultimo_acesso) values (p_email, crypt(p_senha, gen_salt('bf')), primeiro, now()) returning id into u; t := encode(gen_random_bytes(32), 'hex'); insert into sk_sessoes (token, usuario_id) values (t, u); return t; end $f$",
    "create or replace function sk_entrar(p_email text, p_senha text) returns text " + DEF + " declare v_id uuid; v_hash text; t text; begin select id, senha_hash into v_id, v_hash from sk_usuarios where email = lower(trim(p_email)); if v_id is null or v_hash <> crypt(p_senha, v_hash) then perform pg_sleep(1); raise exception 'LOGIN_ERRADO'; end if; update sk_usuarios set ultimo_acesso = now() where id = v_id; delete from sk_sessoes where usuario_id = v_id and ultimo < now() - interval '90 days'; t := encode(gen_random_bytes(32), 'hex'); insert into sk_sessoes (token, usuario_id) values (t, v_id); return t; end $f$",
    "create or replace function sk_sair(p_token text) returns boolean " + DEF + " begin delete from sk_sessoes where token = p_token; return true; end $f$",
    "create or replace function sk_trocar_senha(p_token text, p_atual text, p_nova text) returns boolean " + DEF + " declare u uuid := sk_usuario(p_token); v_hash text; begin select senha_hash into v_hash from sk_usuarios where id = u; if v_hash <> crypt(p_atual, v_hash) then raise exception 'LOGIN_ERRADO'; end if; if length(coalesce(p_nova, '')) < 6 then raise exception 'SENHA_CURTA'; end if; update sk_usuarios set senha_hash = crypt(p_nova, gen_salt('bf')) where id = u; return true; end $f$",
    "create or replace function sk_conta(p_token text) returns jsonb " + DEF + " declare u uuid := sk_usuario(p_token); r jsonb; begin select jsonb_build_object('email', email, 'criado', criado, 'dono', dono) into r from sk_usuarios where id = u; return r; end $f$",
    "create or replace function sk_lista(p_token text, p_loja text) returns jsonb " + DEF + " declare u uuid := sk_usuario(p_token); t text := sk_tabela(p_loja); r jsonb; begin if t is null then raise exception 'LOJA_INVALIDA'; end if; execute format('select coalesce(jsonb_agg(dados order by atualizado desc), ''[]''::jsonb) from (select dados, atualizado from %I where usuario_id = $1 and not apagado order by atualizado desc limit 3000) x', t) into r using u; return r; end $f$",
    "create or replace function sk_pega(p_token text, p_loja text, p_id text) returns jsonb " + DEF + " declare u uuid := sk_usuario(p_token); t text := sk_tabela(p_loja); r jsonb; begin if t is null then raise exception 'LOJA_INVALIDA'; end if; execute format('select dados from %I where usuario_id = $1 and id = $2 and not apagado', t) into r using u, p_id; return r; end $f$",
    "create or replace function sk_grava(p_token text, p_loja text, p_linhas jsonb) returns integer " + DEF + " declare u uuid := sk_usuario(p_token); t text := sk_tabela(p_loja); e jsonb; n integer := 0; begin if t is null then raise exception 'LOJA_INVALIDA'; end if; for e in select * from jsonb_array_elements(p_linhas) loop execute format('insert into %I as x (usuario_id, id, titulo, dados, apagado, atualizado) values ($1, $2, $3, $4, $5, $6) on conflict (usuario_id, id) do update set titulo = excluded.titulo, dados = excluded.dados, apagado = excluded.apagado, atualizado = excluded.atualizado where x.atualizado <= excluded.atualizado', t) using u, e->>'id', e->>'titulo', case when coalesce((e->>'apagado')::boolean, false) then null else e->'dados' end, coalesce((e->>'apagado')::boolean, false), coalesce((e->>'atualizado')::bigint, (extract(epoch from now()) * 1000)::bigint); n := n + 1; end loop; return n; end $f$",
    // traz o que já estava na tabela antiga (mc_itens) para as tabelas fixas — só para a conta DONA (a 1ª criada); não apaga nada
    "create or replace function sk_trazer_mc_itens(p_token text) returns integer " + DEF + " declare u uuid := sk_usuario(p_token); l text; n integer := 0; k integer; begin if not (select dono from sk_usuarios where id = u) then raise exception 'SO_O_DONO'; end if; if to_regclass('public.mc_itens') is null then return 0; end if; foreach l in array array['documentos','modelos','ementas','historico','conversas','regras','codigos'] loop execute format('insert into %I (usuario_id, id, titulo, dados, apagado, atualizado) select $1, m.id, left(coalesce(m.dados->>''titulo'', m.dados->>''nome'', ''''), 300), m.dados, false, m.atualizado from mc_itens m where m.tipo = $2 and not m.apagado and m.dados is not null on conflict (usuario_id, id) do nothing', 'jur_' || l) using u, 'jur:' || l; get diagnostics k = row_count; n := n + k; end loop; return n; end $f$",
    "create or replace function sk_contagem(p_token text) returns jsonb " + DEF + " declare u uuid := sk_usuario(p_token); l text; r jsonb := '{}'::jsonb; n bigint; tam bigint; begin foreach l in array array['" + LOJAS.join("','") + "'] loop execute format('select count(*), coalesce(sum(pg_column_size(dados)), 0) from %I where usuario_id = $1 and not apagado', 'jur_' || l) into n, tam using u; r := r || jsonb_build_object(l, jsonb_build_object('itens', n, 'bytes', tam)); end loop; return r; end $f$",
    // só para o dono do banco (rodar no SQL Editor): trocar a senha de alguém que esqueceu
    "create or replace function sk_nova_senha(p_email text, p_nova text) returns boolean " + DEF + " begin update sk_usuarios set senha_hash = crypt(p_nova, gen_salt('bf')) where email = lower(trim(p_email)); return found; end $f$",
    // o usuário LIMITADO do app: só chama as funções acima, não lê tabela nenhuma
    "do $f$ begin if not exists (select 1 from pg_roles where rolname = '" + CN.usuario + "') then execute format('create role %I login password %L', '" + CN.usuario + "', '" + CN.senha + "'); else execute format('alter role %I login password %L', '" + CN.usuario + "', '" + CN.senha + "'); end if; end $f$",
    "revoke all on all tables in schema public from " + CN.usuario,
    "revoke execute on function sk_nova_senha(text, text) from public",
    "revoke execute on function sk_usuario(text) from public",
    "grant execute on function sk_criar_conta(text, text), sk_entrar(text, text), sk_sair(text), sk_trocar_senha(text, text, text), sk_conta(text), sk_lista(text, text), sk_pega(text, text, text), sk_grava(text, text, jsonb), sk_trazer_mc_itens(text), sk_contagem(text) to " + CN.usuario,
  ]);
  async function preparar(enderecoDono, aviso) {
    const c = String(enderecoDono || '').trim();
    if (!/^postgres(ql)?:\/\//i.test(c)) throw new Error('Cole o endereço do Neon que começa com postgresql:// (o do dono, com a senha).');
    const host = (c.match(/@([^/:?]+)/) || [])[1] || '';
    const base = (h) => h.replace(/-pooler/, '');
    if (host && base(host) !== base(CN.host)) throw new Error('Esse endereço é de OUTRO banco (' + host + '). O app está ligado no banco ' + CN.host + '. Use o endereço desse, ou me avise para eu trocar o banco embutido.');
    let i = 0;
    for (const s of SQL) { i++; if (aviso) aviso('⏳ Preparando o banco… ' + i + '/' + SQL.length); await NuvemNeon.consulta(c, s, []); }
    return SQL.length;
  }

  // ── 🩺 DIAGNÓSTICO (26/11-G): preto no branco — onde estão as coisas, quanto ocupa, se a nuvem responde ──
  const MB = (b) => (b / 1048576).toFixed(1) + ' MB';
  async function diagnostico() {
    const linhas = [], s = sessao();
    const add = (t) => linhas.push(t);
    add('🩺 DIAGNÓSTICO — ' + new Date().toLocaleString('pt-BR') + ' — ' + (J.versao || ''));
    add('Aparelho: ' + (/Android/i.test(navigator.userAgent) ? 'celular Android' : /Windows/i.test(navigator.userAgent) ? 'PC Windows' : navigator.platform) + ' · endereço do app: ' + location.host);
    add('');
    add('1) A CONTA');
    if (!ativa()) add('   ❌ A conta no Neon está DESLIGADA nesta versão.');
    else add('   Banco embutido: ' + CN.host + ' / ' + (CN.banco || 'neondb'));
    add('   ' + (s ? '✅ Entrou como ' + s.email : '❌ NÃO entrou com e-mail e senha neste aparelho — nada vai para a nuvem enquanto não entrar.'));
    add('');
    add('2) A NUVEM (o seu Neon)');
    if (s) {
      const t0 = Date.now();
      try {
        const c = await chamar('sk_contagem', [token()]); const ms = Date.now() - t0;
        add('   ✅ Respondeu em ' + ms + ' ms. O que está guardado na SUA conta:');
        let tot = 0; for (const [l, v] of Object.entries(c || {})) { tot += +v.bytes || 0; add('   • jur_' + l + ': ' + v.itens + ' item(ns) · ' + MB(+v.bytes || 0)); }
        add('   Total na nuvem: ' + MB(tot));
      } catch (e) { add('   ⚠ ' + e.message + (/preparado/.test(e.message) ? '' : ' (se for "sk_contagem não existe": faça o "preparar o banco" de novo, uma vez)')); }
      try { const id = 'teste-' + Date.now(); await grava('config', [{ id, dados: { id, titulo: 'teste de sincronia' }, atualizado: Date.now() }]); const v = await pega('config', id); await grava('config', [{ id, apagado: true, atualizado: Date.now() + 1 }]); add('   ' + (v ? '✅ Teste de gravar e ler na nuvem: OK' : '❌ Teste de gravar e ler na nuvem: FALHOU')); } catch (e) { add('   ❌ Teste de gravar: ' + e.message); }
    } else add('   (entre com e-mail e senha para testar)');
    add('');
    add('3) ESTE APARELHO (o que está ocupando aqui)');
    try { const e = await navigator.storage.estimate(); add('   Este app ocupa: ' + MB(e.usage || 0) + ' (limite do navegador: ' + MB(e.quota || 0) + ')'); if (e.usageDetails) for (const [k, v] of Object.entries(e.usageDetails)) add('   • ' + ({ indexedDB: 'banco do aparelho (IndexedDB)', caches: 'cache das telas (service worker)', serviceWorkerRegistrations: 'service worker' }[k] || k) + ': ' + MB(v)); } catch (e) { add('   (este navegador não informa o tamanho)'); }
    try { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += (k.length + (localStorage.getItem(k) || '').length) * 2; } add('   • preferências (localStorage): ' + MB(n)); } catch (e) {}
    try { const L = J.dbLocal || J.db; let tot = 0; for (const l of (J.db.LOJAS || [])) { const a = await L.todos(l); if (a.length) { const b = new Blob([JSON.stringify(a)]).size; tot += b; add('   • cópias de ' + l + ' neste aparelho: ' + a.length + ' · ' + MB(b)); } } add('   Cópias do jurídico neste aparelho: ' + MB(tot) + (tot > 5 * 1048576 ? '  ← use "🧹 Liberar espaço"' : '')); } catch (e) {}
    try { const ks = await caches.keys(); for (const k of ks) { const c = await caches.open(k); const reqs = await c.keys(); add('   • cache "' + k + '": ' + reqs.length + ' arquivo(s)'); } } catch (e) {}
    try { if (indexedDB.databases) { const dbs = await indexedDB.databases(); add('   Bancos do aparelho neste endereço: ' + dbs.map((d) => d.name).join(', ')); } } catch (e) {}
    add('');
    add('4) O QUE FAZER');
    if (!s) add('   → Entre com e-mail e senha (⚙️ Config → ☁️ Nuvem → 🔑 Entrar).');
    add('   → Se "Este app ocupa" estiver grande: "🧹 Liberar espaço" (tira as cópias, depois de conferir na nuvem) e "🗑 Limpar cache velho".');
    add('   → Cada aparelho mostra o MESMO que está na nuvem quando os dois entraram com o MESMO e-mail.');
    return linhas.join('\n');
  }
  async function limparCacheVelho() {
    let n = 0; try { const atual = (await caches.keys()).filter((k) => /sk-juridico-html/.test(k)).sort().pop(); for (const k of await caches.keys()) if (k !== atual) { await caches.delete(k); n++; } } catch (e) {}
    try { if (J.online && J.online.limpaCache) (J.db.LOJAS || []).forEach((l) => J.online.limpaCache(l)); } catch (e) {}
    return n;
  }
  function abrirDiagnostico() {
    let w = document.getElementById('cn-diag'); if (w) w.remove();
    w = document.createElement('div'); w.id = 'cn-diag'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
    w.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;padding:12px;overflow:auto';
    w.innerHTML = '<div style="background:var(--card,#fff);color:var(--tinta,#111);max-width:760px;width:100%;border-radius:12px;padding:14px"><h3 style="margin:0 0 8px">🩺 Diagnóstico</h3><pre id="cn-diag-txt" style="white-space:pre-wrap;font:13px/1.45 ui-monospace,monospace;max-height:60vh;overflow:auto;background:rgba(127,127,127,.1);padding:10px;border-radius:8px">⏳ Conferindo…</pre>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="bt forte" data-d="copiar">📋 Copiar (para mandar à IA)</button><button class="bt" data-d="liberar">🧹 Liberar espaço</button><button class="bt" data-d="cache">🗑 Limpar cache velho</button><button class="bt" data-d="de-novo">🔄 Conferir de novo</button><button class="bt" data-d="fechar">✖ Fechar</button></div></div>';
    document.body.appendChild(w);
    const rodar = async () => { const t = w.querySelector('#cn-diag-txt'); t.textContent = '⏳ Conferindo…'; try { t.textContent = await diagnostico(); } catch (e) { t.textContent = '⚠ ' + e.message; } };
    w.onclick = async (e) => {
      const b = e.target.closest('[data-d]'); if (!b) { if (e.target === w) w.remove(); return; }
      const d = b.dataset.d;
      if (d === 'fechar') return w.remove();
      if (d === 'copiar') { try { await navigator.clipboard.writeText(w.querySelector('#cn-diag-txt').textContent); J.aviso('📋 Copiado.', 'ok'); } catch (er) {} return; }
      if (d === 'de-novo') return rodar();
      if (d === 'cache') { const n = await limparCacheVelho(); J.aviso('🗑 ' + n + ' cache(s) velho(s) apagado(s).', 'ok'); return rodar(); }
      if (d === 'liberar') { try { await J.online.liberar(); } catch (er) { J.aviso('⚠ ' + er.message, 'erro'); } return rodar(); }
    };
    rodar();
  }

  // ── ⚙️ Config → ☁️ Nuvem: o quadro da conta (aparece em cima de tudo) ──
  function quadro() {
    const el = J.$ && J.$('#cf-nuvem'); if (!el || !ativa()) return;
    let q = J.$('#cn-quadro'); if (!q) { q = document.createElement('div'); q.id = 'cn-quadro'; q.className = 'caixa'; q.style.marginBottom = '12px'; el.prepend(q); }
    const s = sessao(), E = J.esc;
    q.innerHTML = '<h3 style="margin:0 0 6px">🐘 Conta no Neon (igual à Replit)</h3>' + (s
      ? '<p>✅ Entrou como <b>' + E(s.email) + '</b>. Tudo é lido e gravado <b>direto no banco</b>, nas tabelas fixas. Em qualquer aparelho: só e-mail e senha.</p>' +
        '<div class="linha" style="gap:6px;flex-wrap:wrap"><button class="bt forte" data-cn="diag">🩺 Diagnóstico</button><button class="bt" data-cn="antigos">📥 Trazer o que estava na tabela antiga (mc_itens)</button><button class="bt" data-cn="liberar">🧹 Liberar espaço deste aparelho</button><button class="bt" data-cn="senha">🔑 Trocar a senha</button><button class="bt" data-cn="sair">🚪 Sair</button></div><p class="peq mut" id="cn-msg"></p>'
      : '<p>❌ Você ainda não entrou neste aparelho: nada vai para a nuvem. <button class="bt forte" data-cn="entrar">🔑 Entrar com e-mail e senha</button> <button class="bt" data-cn="diag">🩺 Diagnóstico</button></p>');
    q.onclick = async (e) => {
      const b = e.target.closest('[data-cn]'); if (!b) return; const m = (t) => { const x = J.$('#cn-msg'); if (x) x.textContent = t; };
      try {
        if (b.dataset.cn === 'entrar') { J.entrada && J.entrada.mostrar(); return; }
        if (b.dataset.cn === 'diag') { abrirDiagnostico(); return; }
        if (b.dataset.cn === 'sair') { await sair(); quadro(); J.aviso('Saiu. Para entrar de novo: e-mail e senha.'); if (J.entrada) J.entrada.mostrar(); return; }
        if (b.dataset.cn === 'antigos') { m('⏳ Trazendo…'); const n = await trazerAntigos(); m('✅ ' + n + ' item(ns) trazidos da mc_itens para as tabelas fixas (nada foi apagado lá).'); try { J.recarregar && J.recarregar(); } catch (er) {} return; }
        if (b.dataset.cn === 'liberar') { await J.online.liberar(); m('🧹 ' + (await J.online.ocupa()) + ' ocupados agora neste navegador.'); return; }
        if (b.dataset.cn === 'senha') { const a = prompt('Senha ATUAL:'); if (!a) return; const n = prompt('Senha NOVA (mínimo 6):'); if (!n) return; await trocarSenha(a, n); m('✅ Senha trocada. As chaves das IAs foram trancadas de novo com a senha nova.'); return; }
      } catch (er) { m('⚠ ' + er.message); J.aviso('⚠ ' + er.message, 'erro', 7000); }
    };
  }
  if (ativa()) document.addEventListener('DOMContentLoaded', () => {
    ganchoPrefs();
    if (J.nuvem && J.nuvem.pintar) { const p0 = J.nuvem.pintar; J.nuvem.pintar = function () { const r = p0.apply(this, arguments); try { quadro(); } catch (e) {} return r; }; }
    setTimeout(quadro, 500);
    if (J.on) J.on('nuvem', () => setTimeout(quadro, 50));
  });
  J.conta = { diagnostico, abrirDiagnostico, ativa, sessao, entrar, sair, trocarSenha, trazerAntigos, minhaConta, lista, pega, grava, preparar, LOJAS, SQL };
})(window.J);
