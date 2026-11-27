/* SK Jurídico HTML — 12-online.js · ☁️ MODO ONLINE (IGUAL À REPLIT) (19/11)
   Com a nuvem ligada (Supabase com login OU o seu Neon), os documentos, modelos, ementas,
   conversas, regras e códigos ficam SÓ na nuvem — o aparelho (PWA/APK) não enche, e não
   existe mais "enviar e puxar": abriu em outro aparelho, está lá.
   Cada lista é lida quando a tela pede (e guardada 1 minuto na memória, para não gastar).
   Sem internet: guarda aqui e sobe sozinho quando a internet voltar.
   Desligar: ⚙️ Config → ☁️ Nuvem → "Modo online". */
(function (J) {
  'use strict';
  const D = J.db, T = 'mc_itens', enc = encodeURIComponent;
  const local = { todos: D.todos.bind(D), pegar: D.pegar.bind(D), guardar: D.guardar.bind(D), apagar: D.apagar.bind(D) };
  J.dbLocal = local;
  const LOJAS = D.LOJAS;
  const conta = () => !!(J.conta && J.conta.ativa() && J.conta.sessao()); // 🐘 26/11: conta no Neon (e-mail + senha, tabelas fixas)
  function ligado() { if (conta()) return true; const N = J.nuvem; try { return !!(N && J.pref.get('online', true) && N.logado()); } catch (e) { return false; } }
  const neon = () => J.nuvem.ehNeon();
  const conn = () => { try { return JSON.parse(localStorage.getItem('meuchat:nuvem:neon') || '""'); } catch (e) { return ''; } };
  const cache = new Map(); const VALE = 60000;
  const limpaCache = (loja) => cache.delete(loja);
  // ── as 4 perguntas à nuvem ──
  async function nLista(loja) {
    if (conta()) return J.conta.lista(loja);
    if (neon()) return (await NuvemNeon.consulta(conn(), 'select dados from mc_itens where tipo = $1 and not apagado order by atualizado desc limit 3000', ['jur:' + loja])).map((r) => (typeof r.dados === 'string' ? JSON.parse(r.dados) : r.dados)).filter(Boolean);
    return ((await J.nuvem.rest('GET', T + '?select=dados&tipo=eq.' + enc('jur:' + loja) + '&apagado=eq.false&order=atualizado.desc&limit=3000')) || []).map((r) => r.dados).filter(Boolean);
  }
  async function nPega(loja, id) {
    if (conta()) return J.conta.pega(loja, id);
    if (neon()) { const l = await NuvemNeon.consulta(conn(), 'select dados from mc_itens where tipo = $1 and id = $2 and not apagado limit 1', ['jur:' + loja, String(id)]); const d = l[0] && l[0].dados; return typeof d === 'string' ? JSON.parse(d) : (d || null); }
    const l = await J.nuvem.rest('GET', T + '?select=dados&tipo=eq.' + enc('jur:' + loja) + '&id=eq.' + enc(id) + '&apagado=eq.false&limit=1'); return (l && l[0] && l[0].dados) || null;
  }
  async function nGrava(linhas) {
    if (conta()) { const g = {}; linhas.forEach((l) => { const lo = String(l.tipo).replace(/^jur:/, ''); (g[lo] = g[lo] || []).push(l); }); for (const [lo, ls] of Object.entries(g)) await J.conta.grava(lo, ls); return; }
    if (neon()) return NuvemNeon.upsert(conn(), linhas);
    return J.nuvem.rest('POST', T + '?on_conflict=user_id,tipo,id', linhas, 'resolution=merge-duplicates,return=minimal');
  }
  const linhaDe = (loja, obj) => ({ tipo: 'jur:' + loja, id: String(obj.id), dados: obj, apagado: false, atualizado: obj.atualizado || Date.now() });
  // ── sem internet: guarda aqui e marca ──
  function pendente(loja, id, apagado) { const p = J.pref.get('online:pendentes', {}); p[loja + '|' + id] = apagado ? 'x' : 1; J.pref.set('online:pendentes', p); }
  async function subirPendentes() {
    if (!ligado() || !navigator.onLine) return;
    const p = J.pref.get('online:pendentes', {}); const ks = Object.keys(p); if (!ks.length) return; let n = 0;
    for (const k of ks) {
      const [loja, id] = k.split('|');
      try {
        const o = await local.pegar(loja, id);
        await nGrava([o ? linhaDe(loja, o) : { tipo: 'jur:' + loja, id, dados: null, apagado: true, atualizado: Date.now() }]);
        delete p[k]; n++; if (o) await local.apagar(loja, id); limpaCache(loja);
      } catch (e) { break; }
    }
    J.pref.set('online:pendentes', p); if (n) J.aviso('☁️ ' + n + ' item(ns) feitos sem internet subiram para a nuvem.', 'ok');
  }
  Object.assign(D, {
    async todos(loja) {
      if (!ligado() || !LOJAS.includes(loja)) return local.todos(loja);
      const c = cache.get(loja); if (c && Date.now() - c.t < VALE) return c.l.slice();
      try {
        const l = await nLista(loja); const ids = new Set(l.map((x) => String(x.id)));
        const p = J.pref.get('online:pendentes', {});
        for (const o of await local.todos(loja)) if (p[loja + '|' + o.id] === 1 && !ids.has(String(o.id))) l.unshift(o);
        cache.set(loja, { t: Date.now(), l }); return l.slice();
      } catch (e) { J.aviso('📴 Sem conexão com a nuvem: mostrando o que está neste aparelho.'); return local.todos(loja); }
    },
    async pegar(loja, id) {
      if (!ligado() || !LOJAS.includes(loja)) return local.pegar(loja, id);
      const p = J.pref.get('online:pendentes', {}); if (p[loja + '|' + id] === 1) return local.pegar(loja, id);
      try { return (await nPega(loja, id)) || (await local.pegar(loja, id)); } catch (e) { return local.pegar(loja, id); }
    },
    async guardar(loja, obj) {
      if (!ligado() || !LOJAS.includes(loja)) return local.guardar(loja, obj);
      obj.id = obj.id || J.uid(); obj.atualizado = Date.now(); limpaCache(loja);
      try { await nGrava([linhaDe(loja, obj)]); J.emit('db', { loja, id: obj.id }); return obj; }
      catch (e) { pendente(loja, obj.id); J.aviso('📴 Sem conexão com a nuvem: guardei neste aparelho. Sobe sozinho quando a internet voltar.'); return local.guardar(loja, obj); }
    },
    async apagar(loja, id) {
      if (!ligado() || !LOJAS.includes(loja)) return local.apagar(loja, id);
      limpaCache(loja);
      try { await nGrava([{ tipo: 'jur:' + loja, id: String(id), dados: null, apagado: true, atualizado: Date.now() }]); await local.apagar(loja, id); J.emit('db', { loja, id }); }
      catch (e) { pendente(loja, id, true); await local.apagar(loja, id); }
    },
  });
  // 🧹 LIBERAR ESPAÇO — backup primeiro, sobe o que falta, tira as cópias daqui (pede CONFIRMO)
  // 🧹 LIBERAR ESPAÇO (26/11-F) — SEM baixar backup gigante (era isso que enchia o PC e demorava 20 minutos):
  // 1) manda para a nuvem o que ainda não está lá; 2) CONFERE na nuvem item por item; 3) só então tira a cópia daqui.
  // A cópia na nuvem É o backup. Nada sai do aparelho sem estar conferido na nuvem. Pede CONFIRMO.
  async function liberar() {
    if (!ligado()) throw new Error('Entre com e-mail e senha primeiro.');
    let total = 0; const porLoja = {}; for (const l of LOJAS) { porLoja[l] = await local.todos(l); total += porLoja[l].length; }
    if (!total) return J.aviso('O aparelho já está leve: nenhuma cópia aqui.', 'ok');
    const r = prompt('Neste aparelho há ' + total + ' cópia(s) guardadas.\n\nVou: 1) mandar para a nuvem o que ainda não está lá, 2) conferir na nuvem, 3) tirar daqui SÓ o que estiver conferido na nuvem.\n(Não baixa nada, não enche o aparelho.)\n\nPara continuar, escreva CONFIRMO:');
    if (String(r || '').trim().toUpperCase() !== 'CONFIRMO') return J.aviso('Cancelado. Nada foi tirado.');
    let subiu = 0, tirou = 0, ficou = 0;
    for (const l of LOJAS) {
      J.aviso('⏳ ' + l + '…', 'info', 2000);
      const naNuvem = new Map((await nLista(l)).map((o) => [String(o.id), o.atualizado || 0]));
      const faltam = porLoja[l].filter((o) => !naNuvem.has(String(o.id)) || (o.atualizado || 0) > naNuvem.get(String(o.id)));
      for (let i = 0; i < faltam.length; i += 20) { await nGrava(faltam.slice(i, i + 20).map((o) => linhaDe(l, o))); subiu += Math.min(20, faltam.length - i); }
      limpaCache(l);
      const conferido = new Set((await nLista(l)).map((o) => String(o.id)));
      for (const o of porLoja[l]) { if (conferido.has(String(o.id))) { await local.apagar(l, o.id); tirou++; } else ficou++; }
    }
    J.pref.set('online:pendentes', {});
    J.aviso('🧹 Pronto: ' + subiu + ' subiram, ' + tirou + ' cópia(s) tiradas deste aparelho' + (ficou ? ', ' + ficou + ' ficaram (não confirmaram na nuvem)' : '') + '. Agora ocupa ' + (await ocupa()) + '.', 'ok', 10000);
  }
  // ao entrar com a conta: manda sozinho para a nuvem o que só existe neste aparelho (não tira nada daqui)
  async function subirOQueSoTemAqui() {
    if (!conta() || !navigator.onLine) return 0; let n = 0;
    for (const l of LOJAS) {
      const aqui = await local.todos(l).catch(() => []); if (!aqui.length) continue;
      const naNuvem = new Set((await nLista(l).catch(() => [])).map((o) => String(o.id)));
      const faltam = aqui.filter((o) => !naNuvem.has(String(o.id)));
      for (let i = 0; i < faltam.length; i += 20) { await nGrava(faltam.slice(i, i + 20).map((o) => linhaDe(l, o))); n += Math.min(20, faltam.length - i); }
      limpaCache(l);
    }
    if (n) J.aviso('☁️ ' + n + ' item(ns) que só estavam neste aparelho foram para a nuvem.', 'ok', 6000);
    return n;
  }
  if (J.on) J.on('nuvem', () => setTimeout(() => subirOQueSoTemAqui().catch(() => {}), 1500));
  async function ocupa() { try { const e = await navigator.storage.estimate(); return (e.usage / 1048576).toFixed(1) + ' MB'; } catch (e) { return '?'; } }
  window.addEventListener('online', subirPendentes);
  document.addEventListener('DOMContentLoaded', () => setTimeout(subirPendentes, 3000));
  J.online = { ligado, liberar, ocupa, subirPendentes, limpaCache, conta, subirOQueSoTemAqui };
})(window.J);
