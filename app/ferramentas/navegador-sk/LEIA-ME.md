# 🌐 Navegador SK — v27/11-A

Abre sites aqui dentro, em **📖 modo leitura** (só o texto) e **🇧🇷 traduz para o português**. Feito para funcionar no navegador (PWA) **e** como **APK**.

## Como funciona
- **No navegador (PWA):** o Chrome bloqueia site dentro de outro site (CORS e "proibido em moldura"). Então o app busca a página pela **cascata de proxies grátis**, a mesma do extrator do Gemini que funciona: AllOrigins → corsproxy.io → CodeTabs → AllOrigins cru. O último recurso é o leitor r.jina.ai, que traz só o texto. Ele começa pelo proxy que funcionou da última vez.
- **No APK:** o Android não tem esse bloqueio. Com o **CapacitorHttp** ligado (já vem no `capacitor.config.json`), o app busca os sites **direto**, sem proxy, inclusive os dos tribunais. O mesmo vale para a Monica e qualquer IA: no APK não existe erro de CORS.

## Botões
- **🌐 Página:** o site aparece aqui dentro. Links e pesquisas (formulários GET) continuam dentro do app. Os scripts do site vêm desligados para não travar; dá para ligar em ⋮.
- **📖 Leitura:** só o texto principal, grande e limpo.
- **🇧🇷 Traduzir:** passa a página (ou a leitura) para o português pelo tradutor do Google, de graça, mantendo o formato.
- **⋮ Mais:** ⭐ favoritos (segure o dedo para tirar) · 📌 guardar a página no aparelho (abre sem internet) · 🗂️ páginas guardadas · 🕐 histórico · ⬇ baixar o texto ou a página, já traduzidos · 📋 copiar · ↗ abrir no Chrome · 🪟 abrir direto.
- Ao abrir o app, a **última página volta sozinha**: nada some.

## Limites (honestos)
- Login e formulários que enviam dados (POST) precisam do Chrome ou do APK.
- Sites com Cloudflare bloqueiam os proxies; no APK costumam abrir.
- Os proxies são grátis e às vezes saem do ar. Por isso existe a cascata.

## Virar APK (Capacitor)
1. Use esta pasta como `www` (webDir) de um projeto Capacitor, ou mande para o seu APK Builder.
2. O `capacitor.config.json` já liga o **CapacitorHttp** (é ele que tira o bloqueio).
3. `npx cap add android` → `npx cap sync android` → gerar o APK (no GitHub Actions ou no Android Studio).

## Arquivos
`index.html` · `css/estilo.css` · `js/00-base.js` (comum) · `10-busca.js` (direto ou cascata) · `20-traducao.js` (tradutor) · `30-leitura.js` (modo leitura) · `40-pagina.js` (mostrar e navegar) · `50-guardar.js` (favoritos, histórico, guardar) · `90-inicio.js` · `capacitor.config.json` · `sw.js` · `manifest.json`
