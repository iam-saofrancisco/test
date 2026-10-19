/* ================================================================
   Álbum — Vitor & Lariça — lógica da página
   (Normalmente não é preciso mexer aqui.
    Para adicionar conteúdo, edite apenas js/dados.js)
   ================================================================ */

const $ = (sel) => document.querySelector(sel);
const CE = (tag, cls) => { const el = document.createElement(tag); if (cls) el.className = cls; return el; };

const CHAVE_COMENTARIOS = "album-comentarios-v1";
const CHAVE_FAVORITOS   = "album-favoritos-v1";
const CHAVE_NOME        = "album-autor-v1";
const CHAVE_VOLUME      = "album-volume-v1";
const CHAVE_MUSICA_IDX  = "album-musica-index-v1";
const CHAVE_TEMA        = "album-tema-v1";

const IMG_INDISPONIVEL = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">' +
  '<rect width="600" height="600" fill="#f0e4e4"/>' +
  '<text x="300" y="290" text-anchor="middle" font-size="70">🖼️</text>' +
  '<text x="300" y="355" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#9a8a8d">Imagem não encontrada</text></svg>'
);

const audio = $("#audio-musica");
const urlAtual = location.href;
const publicado = location.protocol !== "file:";

let abaAtualId = null;
let fotosDaAbaAtual = [];
let indiceLightbox = 0;
let musicaIndex = 0;
let toastTimeout = null;
let buscaAtiva = false;
let buscaTimer = null;
let zoomado = false, origemZoom = { x: 50, y: 50 }, panX = 0, panY = 0;
let ssFotos = [], ssIndice = 0, ssTimer = null;

/* ---------- Armazenamento local ---------- */
function lerJSON(chave, padrao) {
  try { const v = localStorage.getItem(chave); return v !== null ? JSON.parse(v) : padrao; }
  catch (e) { return padrao; }
}
function salvarJSON(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* ignora */ }
}

let comentarios = lerJSON(CHAVE_COMENTARIOS, {});
let favoritos   = lerJSON(CHAVE_FAVORITOS, {});

/* ---------- Utilidades ---------- */
function chaveItem(foto) {
  return (foto._aba || abaAtualId || "?") + "|" + foto.arquivo;
}
function paraData(iso) {
  if (!iso) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
function formatarData(iso) {
  const d = paraData(iso);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
function protegerImagem(img) {
  img.addEventListener("error", function tratar() {
    img.removeEventListener("error", tratar);
    img.src = IMG_INDISPONIVEL;
  });
}
function mostrarToast(mensagem) {
  const t = $("#toast");
  t.textContent = mensagem;
  t.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ---------- Capa ---------- */
function iniciarCapa() {
  const monograma = $("#monograma");
  monograma.textContent = ALBUM.monograma || "";
  monograma.hidden = !ALBUM.monograma;

  if (ALBUM.capa) {
    const teste = new Image();
    teste.onload = () => {
      $("#capa-fundo").style.backgroundImage = "url('" + ALBUM.capa.replace(/'/g, "%27") + "')";
      $("#capa").classList.add("com-foto");
    };
    teste.src = ALBUM.capa;
  }
}

/* ---------- Contador do casal ---------- */
function iniciarContador() {
  const el = $("#contador-casal");
  const data = paraData(ALBUM.dataEspecial);
  if (!data) { el.hidden = true; return; }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dias = Math.floor((hoje - data) / 86400000);
  el.hidden = false;
  if (dias >= 0) {
    el.textContent = "💕 Juntos desde " + formatarData(ALBUM.dataEspecial) + " · " + dias.toLocaleString("pt-BR") + (dias === 1 ? " dia" : " dias");
  } else {
    el.textContent = "💕 Contando os dias para " + formatarData(ALBUM.dataEspecial);
  }
}

/* ---------- Frases do rodapé ---------- */
function iniciarFrases() {
  const el = $("#frase-rodape");
  const frases = ALBUM.frases || [];
  if (!frases.length) { el.hidden = true; return; }
  let i = 0;
  el.textContent = frases[0];
  el.hidden = false;
  setInterval(() => {
    i = (i + 1) % frases.length;
    el.classList.add("trocando");
    setTimeout(() => {
      el.textContent = frases[i];
      el.classList.remove("trocando");
    }, 450);
  }, 9000);
}

/* ---------- Tema claro/escuro ---------- */
function temaEscuroAtivo() {
  const t = document.documentElement.dataset.tema;
  if (t === "escuro") return true;
  if (t === "claro") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function aplicarTema(tema) {
  if (tema === "claro" || tema === "escuro") document.documentElement.dataset.tema = tema;
  else delete document.documentElement.dataset.tema;
  const botao = $("#botao-tema");
  const escuro = temaEscuroAtivo();
  botao.textContent = escuro ? "☀️" : "🌙";
  botao.title = escuro ? "Mudar para claro" : "Mudar para escuro";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = escuro ? "#1d1618" : "#faf6f1";
}
function alternarTema() {
  const novo = temaEscuroAtivo() ? "claro" : "escuro";
  try { localStorage.setItem(CHAVE_TEMA, novo); } catch (e) { /* ignora */ }
  aplicarTema(novo);
}
function iniciarTema() {
  let salvo = null;
  try { salvo = localStorage.getItem(CHAVE_TEMA); } catch (e) { /* ignora */ }
  aplicarTema(salvo === "claro" || salvo === "escuro" ? salvo : null);
}

/* ---------- Abas ---------- */
function obterAbas() {
  const abas = (ALBUM.abas || []).map((aba) => ({
    ...aba,
    fotos: (aba.fotos || []).map((f) => ({ ...f, _aba: aba.id })),
    videos: aba.videos || []
  }));
  const favs = [];
  abas.forEach((aba) => aba.fotos.forEach((f) => { if (favoritos[chaveItem(f)]) favs.push(f); }));
  if (favs.length) {
    abas.push({ id: "__favoritos__", nome: "Favoritos", icone: "⭐", fotos: favs, videos: [], especial: true });
  }
  return abas;
}

function renderAbas() {
  const nav = $("#abas");
  nav.innerHTML = "";
  obterAbas().forEach((aba) => {
    const botao = CE("button", "aba" + (aba.id === abaAtualId ? " ativa" : ""));
    if (aba.icone) {
      const ic = CE("span", "aba-icone");
      ic.textContent = aba.icone;
      botao.appendChild(ic);
    }
    const nome = CE("span");
    nome.textContent = aba.nome || aba.id;
    botao.appendChild(nome);

    const total = (aba.fotos || []).length + (aba.videos || []).length;
    if (total > 0) {
      const contagem = CE("span", "aba-contagem");
      contagem.textContent = total;
      botao.appendChild(contagem);
    }

    botao.addEventListener("click", () => {
      limparBusca(true);
      mostrarAba(aba.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    nav.appendChild(botao);
  });
}

function mostrarAba(id, atualizarHash = true, animar = true) {
  const abas = obterAbas();
  const aba = abas.find((a) => a.id === id) || abas[0] || null;
  abaAtualId = aba ? aba.id : null;
  renderAbas();

  if (!aba) {
    fotosDaAbaAtual = [];
    $("#grade-fotos").innerHTML = "";
    $("#grade-fotos").hidden = true;
    $("#secao-videos").hidden = true;
    $("#aba-vazia").hidden = false;
    return;
  }

  fotosDaAbaAtual = aba.fotos || [];
  renderGaleria(aba, animar);
  renderVideos(aba);

  const vazia = !fotosDaAbaAtual.length && !(aba.videos || []).length;
  $("#aba-vazia").hidden = !vazia;

  if (atualizarHash && !aba.especial) {
    try { history.replaceState(null, "", "#" + encodeURIComponent(aba.id)); } catch (e) { /* ignora */ }
  }
}

/* ---------- Galeria ---------- */
function criarCartaoFoto(foto, indice) {
  const cartao = CE("button", "cartao-foto");
  cartao.type = "button";
  cartao.setAttribute("aria-label", foto.titulo ? "Abrir foto: " + foto.titulo : "Abrir foto");

  const img = document.createElement("img");
  img.loading = "lazy";
  img.decoding = "async";
  img.src = foto.miniatura || foto.arquivo;
  img.alt = foto.titulo || "Foto do álbum";
  protegerImagem(img);
  cartao.appendChild(img);

  const legenda = CE("span", "legenda");
  legenda.textContent = foto.titulo || " ";
  cartao.appendChild(legenda);

  const favoritada = !!favoritos[chaveItem(foto)];
  const estrela = CE("span", "coracao" + (favoritada ? " ativo" : ""));
  estrela.textContent = favoritada ? "⭐" : "☆";
  estrela.title = "Favoritar";
  estrela.addEventListener("click", (ev) => { ev.stopPropagation(); alternarFavorito(foto); });
  cartao.appendChild(estrela);

  cartao.addEventListener("click", () => abrirLightbox(indice));
  return cartao;
}

function renderGaleria(aba, animar) {
  const grade = $("#grade-fotos");
  grade.innerHTML = "";
  const fotos = aba.fotos || [];
  grade.hidden = fotos.length === 0;
  fotos.forEach((foto, i) => grade.appendChild(criarCartaoFoto(foto, i)));

  if (animar && fotos.length) {
    grade.classList.remove("entrando");
    void grade.offsetWidth;
    grade.classList.add("entrando");
  }
}

/* ---------- Vídeos ---------- */
function renderVideos(aba) {
  const secao = $("#secao-videos");
  const grade = $("#grade-videos");
  grade.innerHTML = "";
  const videos = aba.videos || [];
  if (!videos.length) { secao.hidden = true; return; }
  secao.hidden = false;

  videos.forEach((v) => {
    const cartao = CE("div", "cartao-video");
    if (v.youtube) {
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + encodeURIComponent(v.youtube);
      iframe.title = v.titulo || "Vídeo";
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      cartao.appendChild(iframe);
    } else {
      const video = document.createElement("video");
      video.controls = true;
      video.preload = "metadata";
      video.playsInline = true;
      video.src = v.arquivo;
      if (v.poster) video.poster = v.poster;
      cartao.appendChild(video);
    }
    if (v.titulo) {
      const legenda = CE("p", "legenda");
      legenda.textContent = v.titulo;
      cartao.appendChild(legenda);
    }
    grade.appendChild(cartao);
  });
}

/* ---------- Lightbox ---------- */
function abrirLightbox(indice) {
  indiceLightbox = indice;
  atualizarLightbox();
  $("#lightbox").hidden = false;
  document.body.classList.add("sem-rolagem");
}

function fecharLightbox() {
  resetZoom();
  $("#lightbox").hidden = true;
  document.body.classList.remove("sem-rolagem");
}

function navegarLightbox(delta) {
  if (!fotosDaAbaAtual.length) return;
  indiceLightbox = (indiceLightbox + delta + fotosDaAbaAtual.length) % fotosDaAbaAtual.length;
  atualizarLightbox();
}

function atualizarLightbox() {
  const foto = fotosDaAbaAtual[indiceLightbox];
  if (!foto) return;

  resetZoom();
  const img = $("#lb-img");
  img.src = foto.arquivo;
  img.alt = foto.titulo || "";

  const baixar = $("#lb-baixar");
  baixar.href = foto.arquivo;
  baixar.setAttribute("download", foto.arquivo.split("/").pop() || "foto");

  const titulo = $("#lb-titulo");
  titulo.textContent = foto.titulo || "";
  titulo.hidden = !foto.titulo;

  const descricao = $("#lb-descricao");
  descricao.textContent = foto.descricao || "";
  descricao.hidden = !foto.descricao;

  $("#lb-contador").textContent = (indiceLightbox + 1) + " / " + fotosDaAbaAtual.length;

  const soUma = fotosDaAbaAtual.length <= 1;
  $("#lb-anterior").hidden = soUma;
  $("#lb-proxima").hidden = soUma;

  const favoritada = !!favoritos[chaveItem(foto)];
  const botaoFav = $("#lb-favorito");
  botaoFav.textContent = favoritada ? "⭐ Favorito" : "☆ Favoritar";
  botaoFav.classList.toggle("ativo", favoritada);

  renderComentarios(foto);
}

/* ---------- Favoritos ---------- */
function alternarFavorito(foto) {
  const chave = chaveItem(foto);
  if (favoritos[chave]) delete favoritos[chave];
  else favoritos[chave] = true;
  salvarJSON(CHAVE_FAVORITOS, favoritos);

  const estavaAberto = !$("#lightbox").hidden;

  if (abaAtualId === "__favoritos__" && !buscaAtiva && !obterAbas().some((a) => a.id === "__favoritos__")) {
    fecharLightbox();
    mostrarAba(ALBUM.abas && ALBUM.abas[0] ? ALBUM.abas[0].id : null);
    return;
  }

  refazerVisao();

  if (estavaAberto) {
    const novaPosicao = fotosDaAbaAtual.findIndex((f) => chaveItem(f) === chave);
    if (novaPosicao >= 0) { indiceLightbox = novaPosicao; atualizarLightbox(); }
    else fecharLightbox();
  }
}

/* ---------- Comentários ---------- */
function renderComentarios(foto) {
  const chave = chaveItem(foto);
  const lista = $("#lb-comentarios-lista");
  const itens = comentarios[chave] || [];
  lista.innerHTML = "";
  $("#lb-comentarios-contagem").textContent = itens.length ? "(" + itens.length + ")" : "";

  if (!itens.length) {
    const vazio = CE("li", "comentario-vazio");
    vazio.textContent = "Nenhum comentário ainda. Seja o primeiro!";
    lista.appendChild(vazio);
    return;
  }

  itens.forEach((c) => {
    const item = CE("li", "comentario");
    const topo = CE("div", "comentario-topo");
    const nome = document.createElement("strong");
    nome.textContent = c.nome;
    const data = CE("span", "comentario-data");
    data.textContent = formatarData(c.data);
    const apagar = CE("button", "comentario-apagar");
    apagar.type = "button";
    apagar.textContent = "🗑";
    apagar.title = "Apagar comentário";
    apagar.addEventListener("click", () => {
      const atual = comentarios[chave] || [];
      const pos = atual.indexOf(c);
      if (pos >= 0) atual.splice(pos, 1);
      if (!atual.length) delete comentarios[chave];
      salvarJSON(CHAVE_COMENTARIOS, comentarios);
      renderComentarios(foto);
    });
    topo.append(nome, data, apagar);
    const texto = document.createElement("p");
    texto.textContent = c.texto;
    item.append(topo, texto);
    lista.appendChild(item);
  });
  lista.scrollTop = lista.scrollHeight;
}

/* ---------- Música ---------- */
function atualizarBotaoMusica() {
  const tocando = !audio.paused && !!audio.src;
  $("#musica-botao").classList.toggle("tocando", tocando);
  $("#musica-play").textContent = tocando ? "⏸" : "▶";
}
function mostrarDicaMusica() { $("#musica-dica").hidden = false; }
function esconderDicaMusica() { $("#musica-dica").hidden = true; }
function limparGatilhos() {
  document.removeEventListener("pointerdown", tentarNoToque);
  document.removeEventListener("keydown", tentarNoToque);
  esconderDicaMusica();
}
function tentarNoToque() {
  const p = audio.play();
  if (p && p.then) p.then(limparGatilhos).catch(() => {});
}
function iniciarAutoplay() {
  if (!ALBUM.tocarAoAbrir || !(ALBUM.musicas || []).length) return;
  const p = audio.play();
  if (p && p.then) {
    p.catch(() => {
      mostrarDicaMusica();
      document.addEventListener("pointerdown", tentarNoToque, { passive: true });
      document.addEventListener("keydown", tentarNoToque);
    });
  } else {
    setTimeout(() => { if (audio.paused) mostrarDicaMusica(); }, 300);
  }
}
function carregarFaixa(indice, tocar) {
  const musicas = ALBUM.musicas || [];
  if (!musicas.length) return;
  musicaIndex = ((indice % musicas.length) + musicas.length) % musicas.length;
  audio.src = musicas[musicaIndex].arquivo;
  audio.loop = musicas.length === 1; /* música única toca em loop contínuo */
  $("#musica-nome").textContent = musicas[musicaIndex].titulo || "Faixa " + (musicaIndex + 1);
  try { localStorage.setItem(CHAVE_MUSICA_IDX, String(musicaIndex)); } catch (e) { /* ignora */ }
  if (tocar) { const p = audio.play(); if (p && p.catch) p.catch(() => {}); }
  atualizarBotaoMusica();
}
function iniciarMusica() {
  const widget = $("#musica-widget");
  const musicas = ALBUM.musicas || [];
  if (!musicas.length) { widget.hidden = true; return; }
  widget.hidden = false;

  let indice = Number(lerJSON(CHAVE_MUSICA_IDX, 0));
  if (!Number.isFinite(indice) || indice < 0 || indice >= musicas.length) indice = 0;

  let volume = Number(lerJSON(CHAVE_VOLUME, 0.7));
  if (!Number.isFinite(volume)) volume = 0.7;
  audio.volume = Math.min(1, Math.max(0, volume));
  $("#musica-volume").value = audio.volume;

  carregarFaixa(indice, false);

  audio.addEventListener("ended", () => carregarFaixa(musicaIndex + 1, true));
  audio.addEventListener("play", () => { limparGatilhos(); atualizarBotaoMusica(); });
  audio.addEventListener("pause", atualizarBotaoMusica);

  $("#musica-play").addEventListener("click", () => {
    if (audio.paused) { const p = audio.play(); if (p && p.catch) p.catch(() => {}); }
    else audio.pause();
  });
  $("#musica-anterior").addEventListener("click", () => carregarFaixa(musicaIndex - 1, !audio.paused));
  $("#musica-proxima").addEventListener("click", () => carregarFaixa(musicaIndex + 1, !audio.paused));
  $("#musica-volume").addEventListener("input", (e) => {
    audio.volume = Number(e.target.value);
    try { localStorage.setItem(CHAVE_VOLUME, String(audio.volume)); } catch (err) { /* ignora */ }
  });
  $("#musica-botao").addEventListener("click", () => {
    const painel = $("#musica-painel");
    painel.hidden = !painel.hidden;
  });

  iniciarAutoplay();
}

/* ---------- Busca ---------- */
function refazerVisao() {
  if (buscaAtiva) aplicarBusca($("#campo-busca").value);
  else mostrarAba(abaAtualId, false, false);
}

function aplicarBusca(termo) {
  termo = (termo || "").trim().toLowerCase();
  if (!termo) { limparBusca(); return; }

  buscaAtiva = true;
  const todas = [];
  (ALBUM.abas || []).forEach((a) => (a.fotos || []).forEach((f) => todas.push({ ...f, _aba: a.id })));
  const resultado = todas.filter((f) =>
    ((f.titulo || "") + " " + (f.descricao || "")).toLowerCase().includes(termo)
  );

  fotosDaAbaAtual = resultado;
  renderGaleria({ fotos: resultado }, true);
  $("#secao-videos").hidden = true;
  $("#aba-vazia").hidden = true;

  const info = $("#resultado-busca");
  info.hidden = false;
  info.textContent = resultado.length
    ? resultado.length + (resultado.length === 1 ? " foto encontrada" : " fotos encontradas") + " para “" + termo + "”"
    : "Nenhuma foto encontrada para “" + termo + "”";
}

function limparBusca(silencioso) {
  const campo = $("#campo-busca");
  if (campo.value) campo.value = "";
  $("#resultado-busca").hidden = true;
  if (!buscaAtiva) return;
  buscaAtiva = false;
  if (!silencioso) mostrarAba(abaAtualId, false, false);
}

/* ---------- Zoom na foto ---------- */
function aplicarZoom() {
  const img = $("#lb-img");
  img.style.transformOrigin = origemZoom.x + "% " + origemZoom.y + "%";
  img.style.transform = zoomado ? "translate(" + panX + "px, " + panY + "px) scale(2.2)" : "";
  img.classList.toggle("zoomado", zoomado);
}
function alternarZoom(pontoX, pontoY) {
  const img = $("#lb-img");
  if (!img.src) return;
  if (zoomado) {
    zoomado = false; panX = 0; panY = 0;
  } else {
    const r = img.getBoundingClientRect();
    origemZoom = {
      x: Math.min(100, Math.max(0, ((pontoX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((pontoY - r.top) / r.height) * 100))
    };
    panX = 0; panY = 0; zoomado = true;
  }
  aplicarZoom();
}
function resetZoom() {
  zoomado = false; panX = 0; panY = 0; origemZoom = { x: 50, y: 50 };
  aplicarZoom();
}

/* ---------- Slideshow ---------- */
function ssMostrar() {
  const foto = ssFotos[ssIndice];
  if (!foto) return;
  const img = $("#ss-img");
  img.style.animation = "none";
  void img.offsetWidth;
  img.style.animation = "";
  img.src = foto.arquivo;
  img.alt = foto.titulo || "";
  $("#ss-legenda").textContent = foto.titulo || "";
  $("#ss-contador").textContent = (ssIndice + 1) + " / " + ssFotos.length;
  const proxima = ssFotos[(ssIndice + 1) % ssFotos.length];
  if (proxima) { const p = new Image(); p.src = proxima.arquivo; }
}
function ssProxima() { ssIndice = (ssIndice + 1) % ssFotos.length; ssMostrar(); }
function ssAnterior() { ssIndice = (ssIndice - 1 + ssFotos.length) % ssFotos.length; ssMostrar(); }
function ssRetomar() {
  clearInterval(ssTimer);
  ssTimer = setInterval(ssProxima, 4600);
  $("#ss-pausar").textContent = "⏸";
  $("#ss-pausar").title = "Pausar";
}
function ssPausar() {
  clearInterval(ssTimer); ssTimer = null;
  $("#ss-pausar").textContent = "▶";
  $("#ss-pausar").title = "Continuar";
}
function abrirSlideshow() {
  ssFotos = fotosDaAbaAtual.slice();
  if (!ssFotos.length) { mostrarToast("Esta aba não tem fotos para apresentar 🙂"); return; }
  if (!$("#lightbox").hidden) fecharLightbox();
  ssIndice = 0;
  $("#slideshow").hidden = false;
  document.body.classList.add("sem-rolagem");
  ssMostrar();
  ssRetomar();
}
function fecharSlideshow() {
  clearInterval(ssTimer); ssTimer = null;
  $("#slideshow").hidden = true;
  document.body.classList.remove("sem-rolagem");
}
function slideshowAberto() { return !$("#slideshow").hidden; }

/* ---------- Exportar PDF ---------- */
function exportarPDF() {
  const aba = obterAbas().find((a) => a.id === abaAtualId);
  $("#print-info").textContent = [
    ALBUM.titulo || "Álbum",
    aba && !aba.especial ? aba.nome : "Favoritos",
    formatarData(new Date().toISOString())
  ].filter(Boolean).join("  ·  ");
  window.print();
}

/* ---------- Compartilhar ---------- */
function textoCompartilhar() {
  return (ALBUM.titulo || "Álbum") + " — " + (ALBUM.subtitulo || "") + " " + urlAtual;
}
async function copiarLink() {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(urlAtual);
      mostrarToast(publicado ? "Link copiado! 📋" : "Link copiado — ficará público após a publicação 📋");
      return;
    }
    throw new Error("sem clipboard");
  } catch (e) {
    const area = document.createElement("textarea");
    area.value = urlAtual;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      mostrarToast(publicado ? "Link copiado! 📋" : "Link copiado — ficará público após a publicação 📋");
    } catch (err) {
      mostrarToast("Não deu para copiar o link 😕");
    }
    area.remove();
  }
}
function enviarWhatsApp() {
  window.open("https://wa.me/?text=" + encodeURIComponent(textoCompartilhar()), "_blank");
}
async function compartilharNativo() {
  try {
    await navigator.share({ title: ALBUM.titulo || "Álbum", text: ALBUM.subtitulo || "", url: urlAtual });
  } catch (e) { /* usuário cancelou */ }
}

/* ---------- Eventos gerais ---------- */
function ligarEventos() {
  $("#lb-fechar").addEventListener("click", fecharLightbox);
  $("#lb-anterior").addEventListener("click", () => navegarLightbox(-1));
  $("#lb-proxima").addEventListener("click", () => navegarLightbox(1));
  protegerImagem($("#lb-img"));

  $("#lightbox").addEventListener("click", (ev) => {
    if (ev.target === $("#lightbox") || ev.target.id === "lb-imagem-area") fecharLightbox();
  });

  $("#lb-favorito").addEventListener("click", () => {
    const foto = fotosDaAbaAtual[indiceLightbox];
    if (foto) alternarFavorito(foto);
  });

  $("#form-comentario").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const foto = fotosDaAbaAtual[indiceLightbox];
    if (!foto) return;
    const nome = $("#campo-nome").value.trim() || "Anônimo";
    const texto = $("#campo-comentario").value.trim();
    if (!texto) return;
    try { localStorage.setItem(CHAVE_NOME, nome); } catch (e) { /* ignora */ }
    const chave = chaveItem(foto);
    (comentarios[chave] = comentarios[chave] || []).push({ nome, texto, data: new Date().toISOString() });
    salvarJSON(CHAVE_COMENTARIOS, comentarios);
    $("#campo-comentario").value = "";
    renderComentarios(foto);
  });

  $("#botao-pdf").addEventListener("click", exportarPDF);
  $("#botao-apresentar").addEventListener("click", abrirSlideshow);
  $("#botao-tema").addEventListener("click", alternarTema);

  /* Busca */
  $("#campo-busca").addEventListener("input", (e) => {
    const valor = e.target.value;
    clearTimeout(buscaTimer);
    buscaTimer = setTimeout(() => aplicarBusca(valor), 180);
  });
  $("#campo-busca").addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") { limparBusca(); ev.target.blur(); }
  });

  /* Zoom (duplo clique no desktop, duplo toque no celular) */
  let ultimoFoiToque = 0;
  const imgZoom = $("#lb-img");
  imgZoom.addEventListener("dblclick", (ev) => {
    if (Date.now() - ultimoFoiToque < 500) return;
    ev.preventDefault();
    alternarZoom(ev.clientX, ev.clientY);
  });
  let arrastoIni = null;
  imgZoom.addEventListener("pointerdown", (ev) => {
    if (!zoomado) return;
    arrastoIni = { x: ev.clientX - panX, y: ev.clientY - panY };
    imgZoom.classList.add("arrastando");
    try { imgZoom.setPointerCapture(ev.pointerId); } catch (e) { /* ignora */ }
  });
  imgZoom.addEventListener("pointermove", (ev) => {
    if (!arrastoIni) return;
    panX = ev.clientX - arrastoIni.x;
    panY = ev.clientY - arrastoIni.y;
    aplicarZoom();
  });
  const soltarArrasto = () => {
    if (arrastoIni) { arrastoIni = null; imgZoom.classList.remove("arrastando"); }
  };
  imgZoom.addEventListener("pointerup", soltarArrasto);
  imgZoom.addEventListener("pointercancel", soltarArrasto);

  /* Compartilhar */
  $("#botao-compartilhar").addEventListener("click", (ev) => {
    ev.stopPropagation();
    const menu = $("#menu-compartilhar");
    menu.hidden = !menu.hidden;
    $("#botao-compartilhar").setAttribute("aria-expanded", String(!menu.hidden));
  });
  document.addEventListener("click", (ev) => {
    const menu = $("#menu-compartilhar");
    if (!menu.hidden && !ev.target.closest(".menu-area")) menu.hidden = true;
  });
  $("#menu-compartilhar").addEventListener("click", (ev) => {
    const botao = ev.target.closest("button[data-acao]");
    if (!botao) return;
    $("#menu-compartilhar").hidden = true;
    if (botao.dataset.acao === "copiar") copiarLink();
    else if (botao.dataset.acao === "whatsapp") enviarWhatsApp();
    else if (botao.dataset.acao === "nativo") compartilharNativo();
  });

  /* Slideshow */
  $("#ss-pausar").addEventListener("click", () => { ssTimer ? ssPausar() : ssRetomar(); });
  $("#ss-proxima").addEventListener("click", () => { ssProxima(); if (ssTimer) ssRetomar(); });
  $("#ss-anterior").addEventListener("click", () => { ssAnterior(); if (ssTimer) ssRetomar(); });
  $("#ss-fechar").addEventListener("click", fecharSlideshow);

  document.addEventListener("keydown", (ev) => {
    if (slideshowAberto()) {
      if (ev.key === "Escape") fecharSlideshow();
      else if (ev.key === "ArrowLeft") { ssAnterior(); if (ssTimer) ssRetomar(); }
      else if (ev.key === "ArrowRight") { ssProxima(); if (ssTimer) ssRetomar(); }
      else if (ev.key === " ") { ev.preventDefault(); ssTimer ? ssPausar() : ssRetomar(); }
      return;
    }
    if (!$("#lightbox").hidden) {
      if (ev.key === "Escape") fecharLightbox();
      else if (ev.key === "ArrowLeft") navegarLightbox(-1);
      else if (ev.key === "ArrowRight") navegarLightbox(1);
    } else if (ev.key === "Escape") {
      $("#musica-painel").hidden = true;
      $("#menu-compartilhar").hidden = true;
    }
  });

  /* Deslizar o dedo / duplo toque na imagem */
  const area = $("#lb-imagem-area");
  let x0 = null, y0 = null, ultimoToqueTempo = 0, ultimoToqueX = 0, ultimoToqueY = 0;
  area.addEventListener("touchstart", (ev) => {
    const t = ev.changedTouches[0];
    x0 = t.clientX; y0 = t.clientY;
  }, { passive: true });
  area.addEventListener("touchend", (ev) => {
    const t = ev.changedTouches[0];
    const agora = Date.now();
    const dx = x0 === null ? 0 : t.clientX - x0;
    const dy = x0 === null ? 0 : t.clientY - y0;
    x0 = null;

    if (!zoomado && ev.target.id === "lb-img") {
      const dt = agora - ultimoToqueTempo;
      const perto = Math.abs(t.clientX - ultimoToqueX) < 32 && Math.abs(t.clientY - ultimoToqueY) < 32;
      if (dt > 0 && dt < 330 && perto) {
        ultimoToqueTempo = 0;
        ultimoFoiToque = Date.now();
        alternarZoom(t.clientX, t.clientY);
        return;
      }
      ultimoToqueTempo = agora;
      ultimoToqueX = t.clientX;
      ultimoToqueY = t.clientY;
    }

    if (zoomado) return;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) navegarLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/* ---------- Início ---------- */
function iniciar() {
  if (typeof ALBUM === "undefined") {
    document.body.innerHTML = "<p style='padding:40px;font-family:sans-serif'>Erro: o arquivo js/dados.js não foi carregado.</p>";
    return;
  }

  document.title = ALBUM.titulo || "Álbum";
  $("#titulo-album").textContent = ALBUM.titulo || "Álbum";
  const sub = $("#subtitulo-album");
  sub.textContent = ALBUM.subtitulo || "";
  sub.hidden = !ALBUM.subtitulo;

  if (ALBUM.atualizadoEm) {
    $("#rodape-info").textContent = "Álbum atualizado em " + formatarData(ALBUM.atualizadoEm) + "  ·  " + (ALBUM.titulo || "") + " ❤️";
  }

  if (navigator.share) $("#compartilhar-nativo").hidden = false;

  try { $("#campo-nome").value = localStorage.getItem(CHAVE_NOME) || ""; } catch (e) { /* ignora */ }

  iniciarTema();
  iniciarCapa();
  iniciarContador();
  iniciarFrases();
  ligarEventos();
  iniciarMusica();

  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const abas = obterAbas();
  const inicial = abas.some((a) => a.id === hash) ? hash : (abas[0] ? abas[0].id : null);
  mostrarAba(inicial, false);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

iniciar();
