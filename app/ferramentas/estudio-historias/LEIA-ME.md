# 🎬 Estúdio de Histórias — v27/11-D

Transforma um caso (ou a sua história) num vídeo narrado para o YouTube.

## Como usar
1. **⚙️ Config:** cole a chave da IA (Gemini ou Groq têm cota grátis) e toque em 🧪 Testar.
2. **📝 Caso:** toque em 🎤 Falar e conte o caso do seu jeito, ou escreva. Escolha o estilo, o tamanho e o formato (em pé ou deitado). Deixe marcado o 🔒 sigilo.
3. **🪄 Fazer o roteiro:** a IA escreve as cenas. *Palavra* = ênfase; … = pausa.
4. **🎬 Roteiro:** mude o que quiser, troque a ordem e tire ou acrescente cenas.
5. **🎙️ Voz:** grave cada cena lendo do teleprompter (⏺ Gravar / ⏹ Parar), ou traga o áudio pronto em 📂 (da sua voz clonada). O 🔊 Ensaiar lê com a voz do aparelho, só para treinar.
6. **🖼️ Imagens:** 🔎 Pexels / Pixabay já abrem com a busca pronta. Baixe a imagem e escolha em 📂.
7. **🎞️ Vídeo:** 🎬 Montar o vídeo. É em tempo real: deixe a tela ligada. Depois ⬇ Baixar ou 📤 Compartilhar.

## Novo na 27/11-D
- **Imagem no tempo certo:** o roteiro vem em cenas curtas (1 ou 2 frases), cada uma com a imagem do que está sendo falado.
- **Música que muda com a história:** cada cena tem o seu clima (suspense, emocionante, motivacional, leve) e a música troca suavemente quando o ambiente muda.
- **Tom da voz por cena:** a voz da IA fala cada cena do jeito marcado (ex.: "voz baixa e tensa", "aliviado").
- **🎬 Teleprompter de tela cheia:** o texto sobe sozinho na velocidade da fala, mostra COMO FALAR cada cena, conta 3-2-1 e grava cena por cena (✅ Próxima / 🔁 Repetir). Cada gravação é melhorada sozinha.
- **🔌 Ponte de voz:** um programinha que fica aberto no PC ou no Termux; o app pega as vozes da Microsoft sozinho, sem trazer arquivo.

## Novo na 27/11-C
- **⚡ Fazer tudo sozinho:** você conta o caso e o app faz o roteiro, a voz (IA do Google), as imagens (criadas com IA, adaptadas ao caso), a música e o vídeo.
- **🎨 Imagens com IA:** Pollinations (grátis, sem chave) ou Gemini. Jeitos: foto de cinema, ilustração, desenho animado, aquarela, suspense escuro. Dá para mudar o que a IA vai desenhar em cada cena.
- **🎵 Música automática:** criada pelo próprio app conforme o clima (suspense, emocionante, motivacional, leve). Sem direitos autorais.
- **Transições:** uma imagem vai virando a outra, e o vídeo começa e termina escurecendo.

## Novo na 27/11-B
- **Roteiro igual aos apps de vídeo:** escolha **onde vai postar** (YouTube, Shorts, Reels, TikTok). O formato e o tamanho se ajustam sozinhos. Escolha também o **ângulo** (emocionante, mistério, injustiça, educativo, motivacional, humor). Cada cena vem marcada com a parte da estrutura (GANCHO, CONTEXTO, PROBLEMA, VIRADA, DESFECHO, LIÇÃO, CHAMADA).
- **Quem narra?** (aba 🎙️ Voz):
  - 🎙️ **Minha voz:** grava e o app **melhora sozinho**: tira o chiado, corta o silêncio das pontas, deixa a voz encorpada e clara e acerta o volume. Receitas: Locutor, Só limpar, Locutor com sala leve, Rádio. ↩ Original desfaz.
  - 🤖 **Voz da IA do Google (Gemini):** 30 vozes, com o jeito de narrar que vem do ângulo. Usa a sua chave do Gemini.
  - 💻 **Vozes da Microsoft** (Antonio, Francisca, Thalita): baixa um programinha, roda no PC ou no Termux e traz todos os MP3 de uma vez.

## Sua voz clonada
- Em 🎬 Roteiro, toque em ⬇ Roteiro em .txt (uma cena por parágrafo).
- Gere o áudio de cada cena no programa ou site da clonagem.
- Coloque cada áudio na sua cena em 🎙️ Voz → 📂 Áudio pronto.

## Onde ficam as coisas
Tudo fica **neste aparelho** (projetos, gravações e imagens). A chave da IA também. Nada vai para a nuvem.

## Arquivos
- `index.html`, `css/estilo.css`, `manifest.json`, `sw.js`
- `js/00-base.js` (banco no aparelho e avisos) · `10-ia.js` (IA) · `20-caso.js` (contar e fazer o roteiro) · `30-roteiro.js` (cenas) · `40-voz.js` (quem narra) · `42-som.js` (melhorar a voz) · `44-voz-ia.js` (Gemini e Microsoft) · `46-musica.js` (música automática) · `52-imagens-ia.js` (imagens com IA) · `50-imagens.js` (imagens) · `60-video.js` (montar o vídeo) · `70-config.js` · `90-inicio.js`
