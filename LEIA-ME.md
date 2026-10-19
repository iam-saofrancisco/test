# 📷 Álbum — Vitor & Lariça

Álbum de fotos e vídeos em HTML, com visual rosé & dourado. Funciona offline
(duplo clique no `index.html`) e poderá ser publicado com QR code (próxima etapa).

## Como usar agora
1. Abra o arquivo `index.html` (duplo clique).
2. Navegue pelas abas, clique numa foto para ampliar, comente e favorite.

## O que tem
- **Abas**: Casamento 💍, Família ❤️, Laura 👧, Viagens ✈️, Momentos ✨
- **Busca** 🔍 — digite o nome da foto no campo do topo
- **Apresentar** ▶ — slideshow em tela cheia, passando as fotos sozinho
  (espaço pausa, setas trocam, Esc fecha)
- **Zoom** — dois cliques/toques na foto amplia; arraste para explorar
- **Baixar** ⬇ — botão no visualizador salva a foto no aparelho
- **Comentários** e **Favoritos** ⭐ (aba Favoritos automática)
- **Música de fundo** 🎵 — sua música toca em loop contínuo; tenta começar
  sozinha ao abrir e, se o navegador bloquear, começa no primeiro toque na tela
- **Contador do casal** 💕 — "juntos desde 01/07/2026" (calcula sozinho)
- **Frases românticas** — trocam sozinhas no rodapé (edite em `js/dados.js`)
- **Tema claro/escuro** 🌙/☀️ — botão no topo, lembra a escolha
- **📄 Exportar PDF** e **🔗 Compartilhar** (copiar link, WhatsApp, nativo)
- **App no celular (PWA)** — depois de publicado, use "Adicionar à tela
  inicial" no navegador do celular: vira um app com ícone próprio e abre offline

## Foto de capa
Coloque uma foto (paisagem fica melhor) em `midia/capa.jpg` — vira o fundo
do topo automaticamente.

## Sua música
Já está em `midia/musicas/nossa-musica.mp3`, tocando em loop. Para trocar,
substitua o arquivo e/ou registre outro em `js/dados.js` (lista `musicas`).

## Como adicionar fotos e vídeos (o jeito recomendado)
1. Rode o otimizador (opcional, deixa o álbum voar no celular):
   > `powershell -ExecutionPolicy Bypass -File ferramentas\otimizar-fotos.ps1`
   Cria `otimizadas` (visualização) e `minis` (miniaturas) sem mexer nos originais.
2. Peça ao assistente no opencode:
   > "adicionei as fotos na pasta da aba Viagens, atualize o álbum"
3. Ele atualiza o `js/dados.js` e pronto.

⚠️ Prefira nomes de arquivo sem acentos ou espaços (ex.: `praia-2026.jpg`).

## Abas novas
Crie a pasta `midia/fotos/nome-da-aba/` com os arquivos e peça ao assistente
para registrar a aba em `js/dados.js`.

## Comentários e favoritos
Salvos **apenas no aparelho** onde foram escritos (no navegador).

## Vídeos
- Arquivos locais: até ~100 MB cada (limite do GitHub Pages)
- Vídeos maiores ou do YouTube: use `{ youtube: "ID_DO_VIDEO", titulo: "..." }`

## Publicação (próxima etapa)
Quando quiser, o álbum é publicado no GitHub Pages e um QR code é gerado
para abrir no celular de qualquer lugar (e aí o PWA fica instalável).
