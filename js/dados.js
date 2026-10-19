/* ================================================================
   📋 DADOS DO ÁLBUM — Vitor & Lariça
   ----------------------------------------------------------------
   Este é o "índice" do álbum. Quando você adicionar fotos, vídeos,
   músicas ou abas novas, é este arquivo que precisa ser atualizado.
   Você não precisa fazer isso sozinho(a): copie os arquivos para as
   pastas de "midia/" e peça ajuda ao assistente no opencode.
   ================================================================ */

const ALBUM = {

  titulo: "Vitor & Lariça",
  subtitulo: "Nossa história ❤️",
  monograma: "V & L",

  /* 📸 Foto de capa do topo:
     coloque uma foto em  midia/capa.jpg  (paisagem fica melhor).
     Se não existir, o topo usa um fundo bonito pronto. */
  capa: "midia/capa.jpg",

  /* 💕 Contador do casal: data especial (AAAA-MM-DD) */
  dataEspecial: "2026-07-01",

  /* 💬 Frases que aparecem no rodapé, trocando sozinhas */
  frases: [
    "Cada foto guarda um pedacinho da nossa história ❤️",
    "Vitor & Lariça — juntos por onde a vida levar ✨",
    "A Laura fez tudo ficar mais doce 💕",
    "Nosso álbum, nossa vida, nosso amor 🤍",
    "Momentos simples, amor gigante ✨"
  ],

  /* 🎵 Tocar sozinha ao abrir? true = tenta.
     Se o navegador bloquear (celular sempre bloqueia), a música
     começa no primeiro toque na tela. Use false para desativar. */
  tocarAoAbrir: true,

  atualizadoEm: "2026-10-19", // aparece no rodapé

  /* 🎵 Músicas de fundo ------------------------------------------
     Coloque os arquivos em:  midia/musicas/
     Aceita .mp3, .wav, .m4a, .ogg
     Uma única música toca em loop contínuo.
     Exemplo: { titulo: "Nossa música", arquivo: "midia/musicas/nossa-musica.mp3" }
     ------------------------------------------------------------- */
  musicas: [
    { titulo: "Nossa música 🎵", arquivo: "midia/musicas/nossa-musica.mp3" }
  ],

  /* 📑 Abas do álbum ---------------------------------------------
     Cada aba deve ter um "id" único (sem espaços/acentos) e uma
     pasta correspondente em:  midia/fotos/<id>/
     ------------------------------------------------------------- */
  abas: [

    {
      id: "casamento",
      nome: "Casamento",
      icone: "💍",
      fotos: [
        { arquivo: "midia/fotos/casamento/exemplo-1.svg", titulo: "O pedido", descricao: "Substitua pelas suas fotos" },
        { arquivo: "midia/fotos/casamento/exemplo-2.svg", titulo: "A cerimônia", descricao: "" },
        { arquivo: "midia/fotos/casamento/exemplo-3.svg", titulo: "A festa", descricao: "" }
      ],
      videos: [
        // { arquivo: "midia/videos/meu-video.mp4", titulo: "Meu vídeo" },
        // { youtube: "ID_DO_VIDEO", titulo: "Vídeo do YouTube" }
      ]
    },

    {
      id: "familia",
      nome: "Família",
      icone: "❤️",
      fotos: [
        { arquivo: "midia/fotos/familia/exemplo-1.svg", titulo: "Almoço de domingo", descricao: "" },
        { arquivo: "midia/fotos/familia/exemplo-2.svg", titulo: "Piquenique no parque", descricao: "" },
        { arquivo: "midia/fotos/familia/exemplo-3.svg", titulo: "Festa junina", descricao: "" }
      ],
      videos: []
    },

    {
      id: "laura",
      nome: "Laura",
      icone: "👧",
      fotos: [
        { arquivo: "midia/fotos/laura/exemplo-1.svg", titulo: "Primeiros dias", descricao: "" },
        { arquivo: "midia/fotos/laura/exemplo-2.svg", titulo: "Primeiro sorrisinho", descricao: "" },
        { arquivo: "midia/fotos/laura/exemplo-3.svg", titulo: "Brincadeiras em casa", descricao: "" },
        { arquivo: "midia/fotos/laura/exemplo-4.svg", titulo: "Aniversarinho", descricao: "" }
      ],
      videos: []
    },

    {
      id: "viagens",
      nome: "Viagens",
      icone: "✈️",
      fotos: [
        { arquivo: "midia/fotos/viagens/exemplo-1.svg", titulo: "Praia ao amanhecer", descricao: "" },
        { arquivo: "midia/fotos/viagens/exemplo-2.svg", titulo: "Trilha na montanha", descricao: "" },
        { arquivo: "midia/fotos/viagens/exemplo-3.svg", titulo: "Estrada na serra", descricao: "" }
      ],
      videos: []
    },

    {
      id: "momentos",
      nome: "Momentos",
      icone: "✨",
      fotos: [
        { arquivo: "midia/fotos/momentos/exemplo-1.svg", titulo: "Café da manhã especial", descricao: "" },
        { arquivo: "midia/fotos/momentos/exemplo-2.svg", titulo: "Dia de chuva", descricao: "" },
        { arquivo: "midia/fotos/momentos/exemplo-3.svg", titulo: "Pôr do sol", descricao: "" }
      ],
      videos: []
    }

  ]
};
