// Gera todos os assets visuais usados por gerar_slides.js:
//   1. recorte das telas do app (tira a moldura do emulador e a barra do Chrome)
//   2. mockups: celular (app RN) e janela de navegador (painel Angular)
//   3. ícones Lucide em PNG, nas cores da paleta
//   4. fundos com gradiente (capa e slides escuros/claros)
// Uso: node gerar_assets.js
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const Lu = require("react-icons/lu");

const OUT = "pptx_assets";
const SHOTS = "screenshots";

const C = {
  navy: "#0F172A", navy800: "#1E293B", navy700: "#334155",
  sky: "#0EA5E9", sky400: "#38BDF8", sky600: "#0284C7",
  green: "#10B981", indigo: "#6366F1", amber: "#F59E0B", red: "#EF4444",
  slate400: "#94A3B8", white: "#FFFFFF",
};

const ensure = (d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); };

/* ---------- 1. recorte das telas do app ---------------------------------- */
// As telas foram capturadas no Expo Web dentro do emulador de device do Chrome,
// então vêm com moldura do aparelho + barra de endereço "localhost". Numa
// apresentação de app mobile isso denuncia que é web, então o recorte isola só
// a área da aplicação. A geometria do device é a mesma em todas as capturas, o
// que permite normalizar a altura pela mediana e ter uma galeria alinhada.
async function cropShots() {
  ensure(OUT + "/shots");
  const files = fs.readdirSync(SHOTS).filter((f) => f.endsWith(".png") && !f.startsWith("admin"));
  const boxes = {};
  for (const f of files) {
    const { data, info } = await sharp(path.join(SHOTS, f)).raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H, channels: ch } = info;
    const at = (x, y) => { const i = (y * W + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
    const sum = (c) => c[0] + c[1] + c[2];
    const isFrame = (c) => Math.abs(c[0] - c[1]) < 7 && Math.abs(c[1] - c[2]) < 7 && c[0] >= 28 && c[0] <= 72;
    const isBlack = (c) => c[0] < 12 && c[1] < 12 && c[2] < 12;
    const cx = W >> 1;

    // barra de status do Android: primeira faixa bem escura da coluna central
    let ysb = 0;
    while (ysb < H / 4 && sum(at(cx, ysb)) >= 90) ysb++;
    ysb += 8;
    let left = W, right = 0;
    for (let x = 0; x < W; x++) {
      if (sum(at(x, ysb)) < 92) { if (x < left) left = x; if (x + 1 > right) right = x + 1; }
    }

    // pill da barra de endereço -> marca o fim da interface do navegador
    let pill = 0;
    for (let y = 0; y < H / 3; y++) {
      const c = at(cx, y);
      if (Math.abs(c[0] - 49) < 16 && Math.abs(c[1] - 55) < 16 && Math.abs(c[2] - 69) < 16) pill = y;
    }
    const top = pill + 9;
    // Sobe a partir da base descartando moldura do aparelho e barra de
    // navegação preta do Android. O lookahead atravessa a borda clara e fina
    // que o emulador desenha entre a moldura e a tela.
    let y = H - 1;
    while (y > top) {
      if (isFrame(at(cx, y)) || isBlack(at(cx, y))) { y--; continue; }
      let jumped = false;
      for (let k = 1; k <= 10 && y - k > top; k++) {
        if (isFrame(at(cx, y - k)) || isBlack(at(cx, y - k))) { y -= k; jumped = true; break; }
      }
      if (!jumped) break;
    }
    let bottom = y + 1;
    // resto da borda: linhas dessaturadas e sem brilho, no máximo 12 (a barra
    // de abas do app é navy e tem canal azul destacado, então não entra aqui)
    const isEdgeRow = (yy) => {
      let edge = 0, total = 0;
      for (let x = left; x < right; x += 6) {
        const c = at(x, yy), mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
        const lum = (c[0] + c[1] + c[2]) / 3;
        total++;
        // borda clara do emulador (dessaturada e sem brilho) ou cinza/preto da
        // moldura; o navy da barra de abas é escuro mas puxa para o azul, e por
        // isso não entra aqui
        if (mx - mn < 32 && (lum > 120 ? lum < 225 : mx - mn < 10)) edge++;
      }
      return total > 0 && edge / total > 0.92;
    };
    for (let k = 0; k < 12 && bottom > top && isEdgeRow(bottom - 1); k++) bottom--;
    boxes[f] = { left, top, right, bottom, W: W };
  }
  const hs = Object.values(boxes).map((b) => b.bottom - b.top).sort((a, b) => a - b);
  const hMed = hs[hs.length >> 1];
  for (const [f, b] of Object.entries(boxes)) {
    const pad = 3; // o conteúdo vai ~3px além da status bar em cada lado
    const left = Math.max(0, b.left - pad);
    const width = Math.min(b.W - left, b.right - b.left + pad * 2);
    await sharp(path.join(SHOTS, f))
      .extract({ left: left, top: b.bottom - hMed, width: width, height: hMed })
      .toFile(OUT + "/shots/" + f);
  }
  console.log("  telas recortadas: " + files.length + " (" + hMed + "px de altura)");
  return files;
}

/* ---------- 2. mockups ---------------------------------------------------- */
// Moldura de celular desenhada em SVG, com fundo transparente para a sombra
// aplicada no PowerPoint aparecer por baixo: corpo navy, tela com cantos
// arredondados e ilha da câmera.
async function phoneMockup(shot, outName, scale) {
  scale = scale || 2;
  const src = OUT + "/shots/" + shot;
  const meta = await sharp(src).metadata();
  const sw = Math.round(meta.width * scale), sh = Math.round(meta.height * scale);
  const bez = Math.round(9 * scale), rOut = Math.round(34 * scale), rIn = Math.round(26 * scale);
  const W = sw + bez * 2, H = sh + bez * 2;

  const body = Buffer.from('<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#334155"/><stop offset="45%" stop-color="#0F172A"/><stop offset="100%" stop-color="#1E293B"/>' +
    '</linearGradient></defs>' +
    '<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="' + rOut + '" fill="url(#g)"/>' +
    '<rect x="' + bez * 0.35 + '" y="' + bez * 0.35 + '" width="' + (W - bez * 0.7) + '" height="' + (H - bez * 0.7) +
    '" rx="' + (rOut - bez * 0.35) + '" fill="none" stroke="#475569" stroke-width="' + Math.max(1, scale) + '" opacity="0.55"/></svg>');
  const mask = Buffer.from('<svg width="' + sw + '" height="' + sh + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="0" y="0" width="' + sw + '" height="' + sh + '" rx="' + rIn + '" fill="#fff"/></svg>');
  const screen = await sharp(src).resize(sw, sh).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const island = Buffer.from('<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="' + (W / 2 - 20 * scale) + '" y="' + (bez + 5 * scale) + '" width="' + 40 * scale + '" height="' + 9 * scale +
    '" rx="' + 4.5 * scale + '" fill="#0B1220"/></svg>');

  await sharp(body).composite([
    { input: screen, left: bez, top: bez },
    { input: island, left: 0, top: 0 },
  ]).png().toFile(OUT + "/" + outName + ".png");
}

// Moldura de janela de navegador para os prints do painel Angular.
async function browserMockup(srcFile, outName) {
  const meta = await sharp(srcFile).metadata();
  const sw = meta.width, sh = meta.height;
  const bar = Math.round(sh * 0.055), pad = Math.round(bar * 0.2), r = Math.round(bar * 0.42);
  const W = sw + pad * 2, H = sh + bar + pad;
  const dotY = bar / 2 + pad * 0.1, dotR = bar * 0.15;
  const chrome = Buffer.from('<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="' + r + '" fill="#1E293B"/>' +
    '<circle cx="' + (pad + bar * 0.45) + '" cy="' + dotY + '" r="' + dotR + '" fill="#EF4444"/>' +
    '<circle cx="' + (pad + bar * 0.95) + '" cy="' + dotY + '" r="' + dotR + '" fill="#F59E0B"/>' +
    '<circle cx="' + (pad + bar * 1.45) + '" cy="' + dotY + '" r="' + dotR + '" fill="#10B981"/>' +
    '<rect x="' + (pad + bar * 2.1) + '" y="' + (dotY - bar * 0.24) + '" width="' + Math.min(sw * 0.4, 420) +
    '" height="' + bar * 0.48 + '" rx="' + bar * 0.24 + '" fill="#0F172A"/></svg>');
  const mask = Buffer.from('<svg width="' + sw + '" height="' + sh + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="' + sw + '" height="' + sh + '" rx="' + Math.round(r * 0.5) + '" fill="#fff"/></svg>');
  const shot = await sharp(srcFile).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  await sharp(chrome).composite([{ input: shot, left: pad, top: bar }]).png().toFile(OUT + "/" + outName + ".png");
}

/* ---------- 3. ícones ----------------------------------------------------- */
// Mesma família de ícones (Lucide) já usada no app React Native e no painel
// Angular, para os slides falarem a mesma língua visual do produto.
const ICONS = {
  handHeart: "LuHandHeart", mapPin: "LuMapPin", bot: "LuBot", sparkles: "LuSparkles",
  smartphone: "LuSmartphone", server: "LuServer", database: "LuDatabase", lock: "LuKeyRound",
  layout: "LuLayoutDashboard", code: "LuCode", layers: "LuLayers", shield: "LuShieldCheck",
  route: "LuRoute", check: "LuCheck", x: "LuX", alert: "LuTriangleAlert", zap: "LuZap",
  cloud: "LuCloud", terminal: "LuTerminal", fileJson: "LuFileJson", github: "LuGithub",
  youtube: "LuYoutube", fileText: "LuFileText", network: "LuNetwork", refresh: "LuRefreshCw",
  target: "LuTarget", flag: "LuFlag", users: "LuUsers", message: "LuMessageSquare",
  activity: "LuActivity", monitor: "LuMonitorSmartphone", arrowRight: "LuArrowRight",
  boxes: "LuBoxes", plug: "LuPlug", rocket: "LuRocket", circleCheck: "LuCircleCheck",
};
async function icons() {
  const palette = {
    white: C.white, sky: C.sky, green: C.green, navy: C.navy,
    indigo: C.indigo, amber: C.amber, red: C.red, slate: C.slate400,
  };
  let n = 0;
  for (const name of Object.keys(ICONS)) {
    const Comp = Lu[ICONS[name]];
    if (!Comp) throw new Error("ícone ausente em react-icons/lu: " + ICONS[name]);
    const raw = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { size: 256, strokeWidth: 2 }));
    for (const suffix of Object.keys(palette)) {
      const svg = raw.replace(/currentColor/g, palette[suffix]);
      await sharp(Buffer.from(svg)).png().toFile(OUT + "/ic_" + name + "_" + suffix + ".png");
      n++;
    }
  }
  console.log("  ícones: " + n);
}

/* ---------- 4. fundos com gradiente --------------------------------------- */
// pptxgenjs não expõe preenchimento gradiente, então os fundos entram como
// imagem: assim capa e slides escuros têm profundidade em vez de cor chapada.
async function gradients() {
  const W = 1920, H = 1080;
  const grad = async (name, inner) => {
    await sharp(Buffer.from('<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">' + inner + "</svg>"))
      .png().toFile(OUT + "/" + name + ".png");
  };

  const dots = [];
  for (let y = 0; y < H; y += 46) {
    for (let x = 0; x < W; x += 46) dots.push('<circle cx="' + x + '" cy="' + y + '" r="1.6" fill="#38BDF8" opacity="0.13"/>');
  }
  await grad("bg_capa",
    '<defs>' +
    '<linearGradient id="b" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#0B1120"/><stop offset="55%" stop-color="#0F172A"/><stop offset="100%" stop-color="#15304A"/></linearGradient>' +
    '<radialGradient id="h" cx="0.78" cy="0.18" r="0.62">' +
    '<stop offset="0%" stop-color="#0EA5E9" stop-opacity="0.42"/><stop offset="100%" stop-color="#0EA5E9" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="h2" cx="0.06" cy="0.92" r="0.5">' +
    '<stop offset="0%" stop-color="#10B981" stop-opacity="0.24"/><stop offset="100%" stop-color="#10B981" stop-opacity="0"/></radialGradient>' +
    "</defs>" +
    '<rect width="' + W + '" height="' + H + '" fill="url(#b)"/>' +
    "<g>" + dots.join("") + "</g>" +
    '<rect width="' + W + '" height="' + H + '" fill="url(#h)"/>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#h2)"/>');

  await grad("bg_dark",
    '<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#0B1120"/><stop offset="60%" stop-color="#0F172A"/><stop offset="100%" stop-color="#132B41"/></linearGradient>' +
    '<radialGradient id="h" cx="0.5" cy="0.04" r="0.78">' +
    '<stop offset="0%" stop-color="#0EA5E9" stop-opacity="0.22"/><stop offset="100%" stop-color="#0EA5E9" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#b)"/><rect width="' + W + '" height="' + H + '" fill="url(#h)"/>');

  await grad("bg_light",
    '<defs><linearGradient id="b" x1="0" y1="0" x2="0.35" y2="1">' +
    '<stop offset="0%" stop-color="#FFFFFF"/><stop offset="45%" stop-color="#F8FAFC"/><stop offset="100%" stop-color="#EDF3FA"/></linearGradient>' +
    '<radialGradient id="h" cx="0.93" cy="0.05" r="0.55">' +
    '<stop offset="0%" stop-color="#0EA5E9" stop-opacity="0.11"/><stop offset="100%" stop-color="#0EA5E9" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#b)"/><rect width="' + W + '" height="' + H + '" fill="url(#h)"/>');

  // faixa de acento usada no topo de cada slide
  await sharp(Buffer.from('<svg width="1920" height="18" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0%" stop-color="#0EA5E9"/><stop offset="55%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#10B981"/>' +
    '</linearGradient></defs><rect width="1920" height="18" fill="url(#a)"/></svg>'))
    .png().toFile(OUT + "/bar_accent.png");

  console.log("  fundos: bg_capa, bg_dark, bg_light, bar_accent");
}

/* ---------- main ---------------------------------------------------------- */
(async () => {
  ensure(OUT);
  console.log("gerando assets...");
  const shots = await cropShots();
  for (const f of shots) await phoneMockup(f, "mock_" + path.basename(f, ".png"));
  console.log("  mockups de celular: " + shots.length);
  await browserMockup(SHOTS + "/admin_dashboard_crop.png", "mock_admin");
  await browserMockup(SHOTS + "/admin_lista_crop.png", "mock_admin_lista");
  console.log("  mockups de navegador: 2");
  await icons();
  await gradients();
  console.log("assets prontos.");
})();
