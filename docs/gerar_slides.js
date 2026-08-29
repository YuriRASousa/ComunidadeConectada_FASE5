// Slides da entrega — Smart HAS / ComunidadeConectada · Fase 5, Capítulo 1.
// Depende dos assets produzidos por `node gerar_assets.js` (mockups, ícones
// Lucide e fundos com gradiente). Uso: node gerar_assets.js && node gerar_slides.js
const pptxgen = require("pptxgenjs");

const GROUP_NAME = "Yuri Sousa";
const GROUP_RM = "556163";
const REPO_URL = "github.com/YuriRASousa/ComunidadeConectada_FASE5";
const VIDEO_URL = "youtu.be/6GpY25Bgr6E";

/* ========================= sistema de design ============================== */
// Paleta herdada do próprio produto (app React Native e painel Angular), para
// os slides não parecerem um template genérico colado por cima do projeto.
const NAVY = "0F172A", NAVY_800 = "1E293B", NAVY_700 = "334155", NAVY_600 = "475569";
const SKY = "0EA5E9", SKY_400 = "38BDF8", SKY_600 = "0284C7";
const GREEN = "10B981", INDIGO = "6366F1", AMBER = "F59E0B", RED = "EF4444";
const SLATE = "64748B", SLATE_400 = "94A3B8", SLATE_300 = "CBD5E1";
const WHITE = "FFFFFF", BORDER = "E2E8F0", BG = "F8FAFC";
// tons claros para os chips de ícone (mesma escala de cor, nível 100)
const TINT = { [SKY]: "E0F2FE", [GREEN]: "D1FAE5", [INDIGO]: "E0E7FF", [AMBER]: "FEF3C7", [RED]: "FEE2E2", [NAVY_800]: "E2E8F0", [SKY_600]: "E0F2FE" };

const F_TITLE = "Segoe UI Semibold";
const F_BODY = "Segoe UI";
const F_MONO = "Consolas";

const A = "pptx_assets";
const W = 13.33, H = 7.5;
const M = 0.62;              // margem lateral
const CW = W - M * 2;        // largura útil
const SHADOW = { type: "outer", color: "0F172A", opacity: 0.13, blur: 14, offset: 3, angle: 90 };
const SHADOW_SOFT = { type: "outer", color: "0F172A", opacity: 0.08, blur: 8, offset: 2, angle: 90 };
const SHADOW_BIG = { type: "outer", color: "000000", opacity: 0.34, blur: 26, offset: 8, angle: 90 };

const ic = (name, tone) => `${A}/ic_${name}_${tone}.png`;

/* ============================ componentes ================================= */

// Fundo de página. Os gradientes vêm como imagem porque o pptxgenjs só
// preenche shapes com cor chapada.
function bg(s, kind) {
  s.addImage({ path: `${A}/bg_${kind}.png`, x: 0, y: 0, w: W, h: H });
}

// Cabeçalho dos slides de conteúdo: fio de acento, numeração da seção como
// "eyebrow", título e subtítulo. Substitui a antiga faixa navy sólida, que
// pesava a página inteira e se repetia igual em todos os slides.
function header(s, kicker, title, subtitle, opts = {}) {
  const dark = !!opts.dark;
  s.addImage({ path: `${A}/bar_accent.png`, x: 0, y: 0, w: W, h: 0.09 });
  s.addText(kicker.toUpperCase(), {
    x: M, y: 0.42, w: CW, h: 0.26, fontFace: F_TITLE, fontSize: 10.5,
    color: dark ? SKY_400 : SKY, charSpacing: 2.2,
  });
  s.addText(title, {
    x: M, y: 0.68, w: CW, h: 0.62, fontFace: F_TITLE, fontSize: 27,
    color: dark ? WHITE : NAVY,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: M, y: 1.32, w: CW, h: 0.34, fontFace: F_BODY, fontSize: 13,
      color: dark ? SLATE_400 : SLATE,
    });
  }
  s.addShape("rect", {
    x: M, y: subtitle ? 1.78 : 1.44, w: CW, h: 0.012,
    fill: { color: dark ? NAVY_700 : BORDER }, line: { type: "none" },
  });
}

function footer(s, n, dark) {
  s.addText("Smart HAS · Fase 5 · Cap. 1", {
    x: M, y: 7.02, w: 5, h: 0.26, fontFace: F_BODY, fontSize: 9,
    color: dark ? NAVY_600 : SLATE_300,
  });
  s.addShape("ellipse", {
    x: W - M - 0.34, y: 6.98, w: 0.34, h: 0.34,
    fill: { color: dark ? NAVY_800 : "EEF2F7" }, line: { type: "none" },
  });
  s.addText(String(n), {
    x: W - M - 0.34, y: 6.98, w: 0.34, h: 0.34, fontFace: F_TITLE, fontSize: 9,
    color: dark ? SLATE_400 : SLATE, align: "center", valign: "middle", margin: 0,
  });
}

function card(s, x, y, w, h, opts = {}) {
  s.addShape("roundRect", {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: opts.fill || WHITE },
    line: opts.line === false ? { type: "none" } : { color: opts.border || BORDER, width: 1 },
    shadow: opts.shadow === false ? undefined : (opts.shadow || SHADOW_SOFT),
  });
}

// Quadradinho arredondado com o ícone dentro — o "selo" de cada card.
function iconChip(s, x, y, d, icon, color, tone) {
  s.addShape("roundRect", {
    x, y, w: d, h: d, rectRadius: 0.055,
    fill: { color: tone || TINT[color] || "E2E8F0" }, line: { type: "none" },
  });
  const p = d * 0.26;
  s.addImage({ path: ic(icon, colorTone(color)), x: x + p, y: y + p, w: d - p * 2, h: d - p * 2 });
}
function colorTone(color) {
  return { [SKY]: "sky", [SKY_600]: "sky", [GREEN]: "green", [INDIGO]: "indigo",
    [AMBER]: "amber", [RED]: "red", [NAVY]: "navy", [NAVY_800]: "navy", [WHITE]: "white" }[color] || "navy";
}

// Card de conteúdo: chip de ícone, título e lista. A altura é sempre passada
// pelo slide, calculada para o texto — evitando o vazio enorme que sobrava
// quando todos os cards tinham a mesma altura fixa.
function featureCard(s, x, y, w, h, { icon, color, title, lines, dark, fontSize }) {
  card(s, x, y, w, h, dark
    ? { fill: NAVY_800, border: NAVY_700, shadow: false }
    : {});
  const chip = 0.44;
  iconChip(s, x + 0.26, y + 0.26, chip, icon, color, dark ? NAVY_700 : undefined);
  s.addText(title, {
    x: x + 0.26 + chip + 0.18, y: y + 0.26, w: w - chip - 0.7, h: chip,
    fontFace: F_TITLE, fontSize: 13.5, color: dark ? WHITE : NAVY, valign: "middle",
  });
  const items = lines.map((t, i) => ({
    text: t,
    options: {
      bullet: { code: "2022", indent: 13 }, breakLine: i < lines.length - 1,
      fontSize: fontSize || 11.5, color: dark ? SLATE_300 : NAVY_600, paraSpaceAfter: 5,
    },
  }));
  s.addText(items, {
    x: x + 0.3, y: y + 0.26 + chip + 0.18, w: w - 0.6, h: h - chip - 0.72,
    fontFace: F_BODY, valign: "top",
  });
}

// Etiqueta arredondada (badge / chip de stack).
function pill(s, x, y, w, h, text, { fill, color, icon, fontSize }) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: h / 2, fill: { color: fill }, line: { type: "none" } });
  if (icon) {
    const d = h * 0.5;
    s.addImage({ path: icon, x: x + h * 0.3, y: y + (h - d) / 2, w: d, h: d });
  }
  s.addText(text, {
    x: icon ? x + h * 0.86 : x, y, w: icon ? w - h * 0.86 : w, h,
    fontFace: F_TITLE, fontSize: fontSize || 10.5, color, valign: "middle",
    align: icon ? "left" : "center",
  });
}

/* ============================== deck ====================================== */
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = GROUP_NAME;
pres.title = "Smart HAS — Fase 5, Cap. 1";

/* ---- 1. Capa ------------------------------------------------------------- */
{
  const s = pres.addSlide();
  bg(s, "capa");

  const phoneW = 2.62, phoneH = phoneW / 0.492;
  s.addImage({ path: `${A}/mock_home.png`, x: W - M - phoneW - 0.35, y: (H - phoneH) / 2, w: phoneW, h: phoneH, shadow: SHADOW_BIG });

  s.addText("FIAP · FASE 5 · CAPÍTULO 1", {
    x: M, y: 1.28, w: 7, h: 0.3, fontFace: F_TITLE, fontSize: 11.5, color: SKY_400, charSpacing: 3,
  });
  s.addText("Comunidade Conectada", {
    x: M, y: 1.62, w: 8.6, h: 0.95, fontFace: F_TITLE, fontSize: 46, color: WHITE,
  });
  s.addShape("rect", { x: M, y: 2.66, w: 1.5, h: 0.05, fill: { color: SKY }, line: { type: "none" } });
  s.addText("Smart HAS — Mobile Hybrid App e a Sociedade 5.0", {
    x: M, y: 2.86, w: 8.4, h: 0.4, fontFace: F_BODY, fontSize: 17, color: SLATE_300,
  });
  s.addText("De um protótipo Flutter com dados mockados a um sistema full-stack real: app React Native, backend Spring Boot com Firebase e painel administrativo Angular — os três integrados pelo mesmo contrato de API.", {
    x: M, y: 3.4, w: 8.2, h: 1.0, fontFace: F_BODY, fontSize: 12.5, color: SLATE_400, lineSpacingMultiple: 1.32,
  });

  // chips das três frentes entregues
  const chips = [
    ["React Native + Expo", SKY, "smartphone"],
    ["Spring Boot + Firebase", GREEN, "server"],
    ["Angular", INDIGO, "layout"],
  ];
  let cx = M;
  chips.forEach(([label, color, icon]) => {
    const w = 0.66 + label.length * 0.083;
    s.addShape("roundRect", { x: cx, y: 4.62, w, h: 0.44, rectRadius: 0.22, fill: { color: NAVY_800 }, line: { color: NAVY_700, width: 1 } });
    s.addImage({ path: ic(icon, colorTone(color)), x: cx + 0.15, y: 4.735, w: 0.21, h: 0.21 });
    s.addText(label, { x: cx + 0.42, y: 4.62, w: w - 0.5, h: 0.44, fontFace: F_BODY, fontSize: 10.5, color: SLATE_300, valign: "middle" });
    cx += w + 0.16;
  });

  // assinatura
  s.addShape("rect", { x: M, y: 5.55, w: 0.04, h: 0.72, fill: { color: SKY }, line: { type: "none" } });
  s.addImage({ path: `${A}/avatar_yuri.png`, x: M + 0.24, y: 5.55, w: 0.72, h: 0.72, rounding: true });
  s.addText(GROUP_NAME, { x: M + 1.1, y: 5.56, w: 4, h: 0.34, fontFace: F_TITLE, fontSize: 14, color: WHITE });
  s.addText(`RM ${GROUP_RM} · FIAP 2026`, { x: M + 1.1, y: 5.9, w: 4, h: 0.3, fontFace: F_BODY, fontSize: 11, color: SLATE_400 });
}

/* ---- 2. O que é o Smart HAS ---------------------------------------------- */
{
  const s = pres.addSlide();
  bg(s, "light");
  header(s, "01 | O produto", "O que é o Smart HAS", "Um app híbrido de economia colaborativa para a Sociedade 5.0");

  const cw = (CW - 0.5) / 3, y = 2.12, ch = 2.24;
  featureCard(s, M, y, cw, ch, {
    icon: "handHeart", color: SKY, title: "Comunidade conectada",
    lines: ["Pessoas oferecem e pedem recursos entre si", "Ferramentas, saúde, livros, alimentos", "Por empréstimo, troca ou doação"],
  });
  featureCard(s, M + cw + 0.25, y, cw, ch, {
    icon: "mapPin", color: GREEN, title: "Geolocalização",
    lines: ["Recursos aparecem no mapa por proximidade", "Facilita encontros presenciais na vizinhança", "Mapa interativo real (OpenStreetMap)"],
  });
  featureCard(s, M + (cw + 0.25) * 2, y, cw, ch, {
    icon: "bot", color: INDIGO, title: "ConectaIA",
    lines: ["Assistente de IA integrado ao app", "Ajuda a melhorar descrições de ofertas", "Tira dúvidas dos usuários em tempo real"],
  });

  // faixa de fecho, amarrando o produto ao tema da disciplina
  const fy = 4.86;
  card(s, M, fy, CW, 1.42, { fill: NAVY, border: NAVY, shadow: SHADOW });
  iconChip(s, M + 0.34, fy + 0.34, 0.74, "sparkles", SKY, NAVY_800);
  s.addText("Sociedade 5.0 na prática", {
    x: M + 1.28, y: fy + 0.3, w: CW - 1.7, h: 0.34, fontFace: F_TITLE, fontSize: 14, color: WHITE,
  });
  s.addText("Tecnologia usada para resolver um problema social concreto: aproximar vizinhos que têm recursos ociosos de quem precisa deles — com dados reais, não simulados.", {
    x: M + 1.28, y: fy + 0.66, w: CW - 1.7, h: 0.6, fontFace: F_BODY, fontSize: 12, color: SLATE_400, lineSpacingMultiple: 1.25,
  });
  footer(s, 2);
}

/* ---- 3. O ponto de partida (Fase 4) -------------------------------------- */
{
  const s = pres.addSlide();
  bg(s, "light");
  header(s, "02 | Contexto", "O ponto de partida (Fase 4)", "Um protótipo Flutter completo na interface — mas sem nenhum dado real por trás");

  const cw = (CW - 0.3) / 2, y = 2.12, ch = 2.5;
  featureCard(s, M, y, cw, ch, {
    icon: "check", color: GREEN, title: "O que já existia",
    lines: [
      "11 telas funcionais: onboarding, login, home, mapa, chat, chatbot, oferta, perfil",
      "Arquitetura com Provider / ChangeNotifier",
      "Integração com IA (Gemini) para o chat",
      "UI consistente e responsiva",
    ], fontSize: 12,
  });
  featureCard(s, M + cw + 0.3, y, cw, ch, {
    icon: "alert", color: RED, title: "O que faltava",
    lines: [
      "Usuários, recursos e mensagens 100% mockados em memória",
      "Nada persistia — reiniciar o app apagava tudo",
      "Sem autenticação real, sem backend, sem banco de dados",
      "Botão \"Publicar Oferta\" nem sequer salvava o recurso",
    ], fontSize: 12,
  });

  const fy = 5.0;
  card(s, M, fy, CW, 1.14, { fill: "FFF7ED", border: "FED7AA", shadow: false });
  iconChip(s, M + 0.3, fy + 0.28, 0.58, "target", AMBER);
  s.addText("O desafio desta fase", {
    x: M + 1.04, y: fy + 0.22, w: CW - 1.4, h: 0.32, fontFace: F_TITLE, fontSize: 13, color: "9A3412",
  });
  s.addText("Transformar a interface pronta em um sistema real — persistência, autenticação e uma API que o app e o painel administrativo pudessem consumir de verdade.", {
    x: M + 1.04, y: fy + 0.54, w: CW - 1.4, h: 0.44, fontFace: F_BODY, fontSize: 11.5, color: "9A3412",
  });
  footer(s, 3);
}

/* ---- 4. Escolha da stack mobile ------------------------------------------ */
{
  const s = pres.addSlide();
  bg(s, "light");
  header(s, "03 | Parte 1", "Escolha da stack mobile", "React Native não foi escolha de gosto: foi o que alinha a entrega ao conteúdo ensinado na fase");

  const cw = (CW - 0.3) / 2, y = 2.12, ch = 2.46;
  featureCard(s, M, y, cw, ch, {
    icon: "smartphone", color: SKY, title: "React Native",
    lines: [
      "5 dos 13 capítulos da fase são só sobre React Native",
      "Opção A do enunciado pede View / Text / Image / Button + React Navigation, ao pé da letra",
      "Node.js já disponível; Expo permite montar e testar rápido",
      "Hooks (useState / useEffect) e AsyncStorage seguindo os Cap. 05 e 06",
    ], fontSize: 11.5,
  });
  pill(s, M + cw - 1.42, y + 0.32, 1.16, 0.32, "ESCOLHIDO", { fill: GREEN, color: WHITE, fontSize: 9.5 });

  featureCard(s, M + cw + 0.3, y, cw, ch, {
    icon: "layers", color: NAVY_800, title: "Flutter",
    lines: [
      "11 telas da Fase 4, já integradas ao backend real",
      "Mantido no repositório como histórico do projeto",
      "Não exercita nenhum conteúdo específico desta fase",
      "Serve de base de referência para comparar a migração",
    ], fontSize: 11.5,
  });
  pill(s, M + cw + 0.3 + cw - 1.86, y + 0.32, 1.6, 0.32, "VERSÃO ANTERIOR", { fill: "E2E8F0", color: SLATE, fontSize: 9.5 });

  // conector central
  s.addShape("ellipse", { x: W / 2 - 0.24, y: y + ch / 2 - 0.24, w: 0.48, h: 0.48, fill: { color: NAVY }, line: { color: WHITE, width: 2.5 }, shadow: SHADOW_SOFT });
  s.addText("VS", { x: W / 2 - 0.24, y: y + ch / 2 - 0.24, w: 0.48, h: 0.48, fontFace: F_TITLE, fontSize: 11, color: WHITE, align: "center", valign: "middle" });

  // destaque numérico do critério de decisão
  const fy = 4.98;
  card(s, M, fy, CW, 1.16, { fill: NAVY, border: NAVY, shadow: SHADOW });
  s.addText("5/13", { x: M + 0.34, y: fy + 0.2, w: 1.3, h: 0.76, fontFace: F_TITLE, fontSize: 30, color: SKY_400, valign: "middle" });
  s.addShape("rect", { x: M + 1.72, y: fy + 0.28, w: 0.02, h: 0.6, fill: { color: NAVY_700 }, line: { type: "none" } });
  s.addText("capítulos da Fase 5 são dedicados a React Native", {
    x: M + 1.94, y: fy + 0.24, w: CW - 2.3, h: 0.34, fontFace: F_TITLE, fontSize: 13, color: WHITE,
  });
  s.addText("Migrar o app foi a forma de aplicar de fato o conteúdo da fase, em vez de apenas manter o que já funcionava em Flutter.", {
    x: M + 1.94, y: fy + 0.58, w: CW - 2.3, h: 0.34, fontFace: F_BODY, fontSize: 11.5, color: SLATE_400,
  });
  footer(s, 4);
}

/* ---- 5. Roadmap ---------------------------------------------------------- */
{
  const s = pres.addSlide();
  bg(s, "light");
  header(s, "04 | Trajetória", "Roadmap tecnológico", "Onde o projeto estava, o que esta entrega resolve e o que fica para as próximas fases");

  const steps = [
    { n: "1", color: GREEN, tag: "CONCLUÍDO", title: "Fases 1–4", icon: "check",
      lines: ["Escopo e modelagem do problema", "Protótipo Flutter com 11 telas", "Dados mockados em memória"] },
    { n: "2", color: SKY, tag: "ESTA ENTREGA", title: "Fase 5 · Cap. 1", icon: "zap",
      lines: ["Backend Spring Boot + Firebase", "App migrado para React Native", "Painel administrativo Angular"] },
    { n: "3", color: SLATE_400, tag: "PRÓXIMAS", title: "Fases seguintes", icon: "flag",
      lines: ["Upload real de imagens", "Notificações push", "Sessão persistente no app"] },
  ];
  const cw = (CW - 1.0) / 3, y = 2.72, ch = 2.56;
  // trilho da linha do tempo: o trecho já percorrido vem preenchido
  s.addShape("rect", { x: M + cw / 2, y: y - 0.42, w: CW - cw, h: 0.035, fill: { color: BORDER }, line: { type: "none" } });
  s.addShape("rect", { x: M + cw / 2, y: y - 0.42, w: (CW - cw) / 2, h: 0.035, fill: { color: SKY }, line: { type: "none" } });

  steps.forEach((st, i) => {
    const x = M + i * (cw + 0.5);
    const tone = st.color === SLATE_400 ? NAVY_800 : st.color;
    // nó da linha do tempo
    s.addShape("ellipse", { x: x + cw / 2 - 0.26, y: y - 0.68, w: 0.52, h: 0.52, fill: { color: st.color }, line: { color: WHITE, width: 3 }, shadow: SHADOW_SOFT });
    s.addText(st.n, { x: x + cw / 2 - 0.26, y: y - 0.68, w: 0.52, h: 0.52, fontFace: F_TITLE, fontSize: 15, color: WHITE, align: "center", valign: "middle", margin: 0 });

    card(s, x, y, cw, ch);
    iconChip(s, x + 0.28, y + 0.28, 0.44, st.icon, tone);
    pill(s, x + cw - 1.62, y + 0.34, 1.34, 0.3, st.tag, { fill: TINT[st.color] || "F1F5F9", color: st.color === SLATE_400 ? SLATE : st.color, fontSize: 8.5 });
    s.addText(st.title, { x: x + 0.28, y: y + 0.86, w: cw - 0.56, h: 0.4, fontFace: F_TITLE, fontSize: 16, color: NAVY });
    s.addText(st.lines.map((t, j) => ({
      text: t,
      options: { bullet: { code: "2022", indent: 13 }, breakLine: j < st.lines.length - 1, fontSize: 11.5, color: NAVY_600, paraSpaceAfter: 6 },
    })), { x: x + 0.3, y: y + 1.34, w: cw - 0.6, h: ch - 1.5, fontFace: F_BODY, valign: "top" });
  });

  const fy = 5.62;
  card(s, M, fy, CW, 1.0, { fill: NAVY, border: NAVY, shadow: SHADOW });
  iconChip(s, M + 0.3, fy + 0.24, 0.52, "activity", SKY, NAVY_800);
  s.addText("O que muda nesta entrega: os dados deixam de ser simulados — cada tela do app passa a ler e gravar no Firestore através da API.", {
    x: M + 1.02, y: fy, w: CW - 1.4, h: 1.0, fontFace: F_BODY, fontSize: 12.5, color: SLATE_300, valign: "middle",
  });
  footer(s, 5);
}

/* ---- 6. O app em React Native -------------------------------------------- */
{
  const s = pres.addSlide();
  bg(s, "light");
  header(s, "05 | Parte 1", "O app em React Native", "As telas da Fase 4 reconstruídas com componentes nativos — rodando contra a API real");

  const shots = [
    ["mock_login", "Login real", "Firebase Auth"],
    ["mock_loja", "Home", "recursos da API"],
    ["mock_mapa", "Mapa", "Leaflet + OSM"],
    ["mock_chatIA", "ConectaIA", "Gemini"],
  ];
  const pw = 1.62, ph = pw / 0.492, gap = 0.24, y = 2.16;
  shots.forEach(([file, label, sub], i) => {
    const x = M + i * (pw + gap);
    s.addImage({ path: `${A}/${file}.png`, x, y, w: pw, h: ph, shadow: SHADOW });
    s.addText(label, { x: x - 0.1, y: y + ph + 0.12, w: pw + 0.2, h: 0.26, fontFace: F_TITLE, fontSize: 11.5, color: NAVY, align: "center" });
    s.addText(sub, { x: x - 0.1, y: y + ph + 0.36, w: pw + 0.2, h: 0.24, fontFace: F_BODY, fontSize: 9.5, color: SLATE, align: "center" });
  });

  const px = M + 4 * pw + 3 * gap + 0.34;
  const pwid = W - M - px;
  card(s, px, y, pwid, ph + 0.62);
  s.addText("O que foi aplicado", { x: px + 0.3, y: y + 0.26, w: pwid - 0.6, h: 0.34, fontFace: F_TITLE, fontSize: 14, color: NAVY });
  const applied = [
    ["smartphone", SKY, "Componentes nativos", "View, Text, Image, Button e FlatList — Opção A do enunciado"],
    ["route", INDIGO, "React Navigation", "Stack + Bottom Tabs entre as 8 telas do app"],
    ["refresh", GREEN, "Hooks de estado", "useState e useEffect consumindo a API (Cap. 05 e 06)"],
    ["database", AMBER, "AsyncStorage", "Token JWT guardado no dispositivo entre sessões"],
  ];
  let iy = y + 0.64;
  applied.forEach(([icon, color, t, d]) => {
    iconChip(s, px + 0.3, iy, 0.4, icon, color);
    s.addText(t, { x: px + 0.82, y: iy - 0.02, w: pwid - 1.12, h: 0.26, fontFace: F_TITLE, fontSize: 11.5, color: NAVY });
    s.addText(d, { x: px + 0.82, y: iy + 0.24, w: pwid - 1.12, h: 0.5, fontFace: F_BODY, fontSize: 10, color: NAVY_600, lineSpacingMultiple: 1.2 });
    iy += 0.8;
  });
  footer(s, 6);
}

/* ---- 7. Backend Spring Boot ---------------------------------------------- */
{
  const s = pres.addSlide();
  bg(s, "light");
  header(s, "06 | Parte 2", "Backend Spring Boot", "Java 21 · Spring Boot 4 · Firebase (Cap. 13) — uma API REST para o app e o painel");

  const cards = [
    ["lock", SKY, "Firebase Auth", ["Cadastro e login reais", "Senha nunca trafega pelo backend"]],
    ["database", GREEN, "Firestore", ["Banco NoSQL na nuvem", "CRUD completo e persistente"]],
    ["boxes", INDIGO, "3 entidades", ["User, Resource e Message", "DTOs dedicados por operação"]],
    ["layers", SKY_600, "Camadas", ["Controller → Service → Repository", "Injeção por construtor"]],
    ["shield", AMBER, "Erros padronizados", ["400 / 401 / 403 / 404 / 409", "Formato único de resposta"]],
    ["fileJson", NAVY_800, "Swagger / OpenAPI", ["Documentação interativa", "Disponível em /swagger-ui"]],
  ];
  const cw = (CW - 0.5) / 3, ch = 1.98, rows = [2.1, 4.28];
  cards.forEach(([icon, color, title, lines], i) => {
    const x = M + (i % 3) * (cw + 0.25);
    featureCard(s, x, rows[Math.floor(i / 3)], cw, ch, { icon, color, title, lines, fontSize: 11 });
  });

  s.addText("Todas as regras de negócio ficam no backend — app e painel apenas consomem a mesma API.", {
    x: M, y: 6.48, w: CW, h: 0.3, fontFace: F_BODY, fontSize: 11, color: SLATE, align: "center", italic: true,
  });
  footer(s, 7);
}

/* ---- 8. API REST --------------------------------------------------------- */
{
  const s = pres.addSlide();
  bg(s, "light");
  header(s, "07 | Parte 2", "API REST — cobertura e verificação", "Não é só código escrito: cada rota foi exercitada contra o Firebase real");

  const stats = [["18", "endpoints REST", SKY, "network"], ["3", "entidades persistidas", GREEN, "database"], ["100%", "testado ponta a ponta", INDIGO, "circleCheck"]];
  const sw = (CW - 0.5) / 3, sy = 2.06, sh = 1.32;
  stats.forEach(([v, l, color, icon], i) => {
    const x = M + i * (sw + 0.25);
    card(s, x, sy, sw, sh);
    s.addShape("roundRect", { x: x + 0.24, y: sy + 0.2, w: sw * 0.55, h: 0.05, rectRadius: 0.025, fill: { color }, line: { type: "none" } });
    s.addText(v, { x: x + 0.24, y: sy + 0.36, w: sw - 1.1, h: 0.6, fontFace: F_TITLE, fontSize: 32, color: NAVY, valign: "middle" });
    s.addText(l, { x: x + 0.24, y: sy + 0.94, w: sw - 0.5, h: 0.26, fontFace: F_BODY, fontSize: 11.5, color: SLATE });
    iconChip(s, x + sw - 0.86, sy + 0.42, 0.58, icon, color);
  });

  const cw = (CW - 0.3) / 2, cy = 3.66, ch = 2.86;
  card(s, M, cy, cw, ch);
  iconChip(s, M + 0.28, cy + 0.26, 0.44, "route", SKY);
  s.addText("Principais rotas", { x: M + 0.9, y: cy + 0.26, w: cw - 1.2, h: 0.44, fontFace: F_TITLE, fontSize: 13.5, color: NAVY, valign: "middle" });
  const rotas = [
    ["POST", "/api/auth/register · /api/auth/login"],
    ["GET PUT", "/api/users/me · /api/users (ADMIN)"],
    ["CRUD", "/api/resources"],
    ["GET POST", "/api/messages · /api/messages/conversations"],
    ["GET", "/api/admin/stats (ADMIN)"],
  ];
  let ry = cy + 0.9;
  rotas.forEach(([verb, path]) => {
    s.addShape("roundRect", { x: M + 0.3, y: ry, w: 0.92, h: 0.26, rectRadius: 0.05, fill: { color: "E0F2FE" }, line: { type: "none" } });
    s.addText(verb, { x: M + 0.3, y: ry, w: 0.92, h: 0.26, fontFace: F_TITLE, fontSize: 8, color: SKY_600, align: "center", valign: "middle" });
    s.addText(path, { x: M + 1.32, y: ry - 0.01, w: cw - 1.6, h: 0.28, fontFace: F_MONO, fontSize: 10, color: NAVY_600, valign: "middle" });
    ry += 0.38;
  });

  const vx = M + cw + 0.3;
  card(s, vx, cy, cw, ch);
  iconChip(s, vx + 0.28, cy + 0.26, 0.44, "terminal", GREEN);
  s.addText("Verificado de verdade", { x: vx + 0.9, y: cy + 0.26, w: cw - 1.2, h: 0.44, fontFace: F_TITLE, fontSize: 13.5, color: NAVY, valign: "middle" });
  const checks = [
    "Servidor compilado e rodando localmente (./mvnw spring-boot:run)",
    "Cadastro no Firebase Auth e login com as mesmas credenciais, em chamadas separadas",
    "Regras de permissão dono-vs-admin conferidas na prática",
    "Bug real no SDK do Firebase (\"Not in GZIP format\") encontrado e contornado",
  ];
  let vy = cy + 0.92;
  checks.forEach((t) => {
    s.addImage({ path: ic("circleCheck", "green"), x: vx + 0.32, y: vy + 0.03, w: 0.17, h: 0.17 });
    s.addText(t, { x: vx + 0.6, y: vy - 0.03, w: cw - 0.92, h: 0.5, fontFace: F_BODY, fontSize: 10.5, color: NAVY_600, lineSpacingMultiple: 1.2 });
    vy += 0.5;
  });
  footer(s, 8);
}

/* ---- 9. Dashboard Angular ------------------------------------------------ */
{
  const s = pres.addSlide();
  bg(s, "light");
  header(s, "08 | Parte 3", "Dashboard administrativo Angular", "O mesmo backend, agora consumido por um painel web — com os requisitos do enunciado aplicados");

  const cw = 5.05, y = 2.12;
  const items = [
    ["route", SKY, "Rotas", "/home pública · /login e /admin protegidas por AuthGuard"],
    ["plug", GREEN, "HttpClient + Interceptor", "Anexa o token JWT automaticamente em toda chamada"],
    ["code", INDIGO, "4 formas de binding", "{{ }} interpolação · [ ] property · ( ) evento · [( )] ngModel"],
    ["layers", AMBER, "*ngIf / *ngFor", "Estados de carregamento, erro e vazio nas listas"],
  ];
  const ih = 1.02;
  items.forEach(([icon, color, t, d], i) => {
    const iy = y + i * (ih + 0.14);
    card(s, M, iy, cw, ih);
    iconChip(s, M + 0.26, iy + 0.3, 0.48, icon, color);
    s.addText(t, { x: M + 0.86, y: iy + 0.22, w: cw - 1.1, h: 0.3, fontFace: F_TITLE, fontSize: 12.5, color: NAVY });
    s.addText(d, { x: M + 0.86, y: iy + 0.52, w: cw - 1.1, h: 0.42, fontFace: F_BODY, fontSize: 10.5, color: NAVY_600, lineSpacingMultiple: 1.15 });
  });

  const shotX = M + cw + 0.42, shotW = W - M - shotX;
  const shotH = shotW * (0.055 + 1) * (911 / 1858) * 1.02;
  s.addImage({ path: `${A}/mock_admin.png`, x: shotX, y: y + 0.16, w: shotW, h: shotH, shadow: SHADOW });
  s.addText("Print real de localhost:4200/admin — estatísticas, usuários e recursos vindos da API Spring Boot.", {
    x: shotX, y: y + shotH + 0.34, w: shotW, h: 0.5, fontFace: F_BODY, fontSize: 10.5, color: SLATE, italic: true, lineSpacingMultiple: 1.2,
  });
  footer(s, 9);
}

/* ---- 10. Integração ponta a ponta ---------------------------------------- */
{
  const s = pres.addSlide();
  bg(s, "dark");
  header(s, "09 | Resultado", "Integração ponta a ponta", "As três aplicações compartilham o mesmo contrato de API e os mesmos dados reais", { dark: true });

  const nodes = [
    ["smartphone", SKY, "App React Native", "Login, ofertas, chat\ne mapa", "Expo · TypeScript"],
    ["server", GREEN, "API Spring Boot", "Autenticação, regras de\nnegócio e persistência", "Java 21 · Firebase"],
    ["layout", INDIGO, "Dashboard Angular", "Gestão de usuários e\nestatísticas", "Angular 20 · RxJS"],
  ];
  const nw = 3.44, gap = 0.86, ny = 2.42, nh = 3.06;
  nodes.forEach(([icon, color, title, desc, tech], i) => {
    const x = M + i * (nw + gap) + 0.34;
    card(s, x, ny, nw, nh, { fill: NAVY_800, border: NAVY_700, shadow: false });
    s.addShape("rect", { x: x, y: ny, w: nw, h: 0.06, fill: { color }, line: { type: "none" } });
    iconChip(s, x + nw / 2 - 0.37, ny + 0.42, 0.74, icon, color, NAVY_700);
    s.addText(title, { x: x + 0.2, y: ny + 1.34, w: nw - 0.4, h: 0.34, fontFace: F_TITLE, fontSize: 14, color: WHITE, align: "center" });
    s.addText(desc, { x: x + 0.3, y: ny + 1.74, w: nw - 0.6, h: 0.7, fontFace: F_BODY, fontSize: 11, color: SLATE_400, align: "center", lineSpacingMultiple: 1.2 });
    pill(s, x + nw / 2 - 1.0, ny + nh - 0.62, 2.0, 0.32, tech, { fill: NAVY_700, color: SLATE_300, fontSize: 9 });

    if (i < 2) {
      const ax = x + nw + 0.06, aw = gap - 0.12;
      s.addShape("rect", { x: ax, y: ny + nh / 2 - 0.015, w: aw, h: 0.03, fill: { color: NAVY_600 }, line: { type: "none" } });
      s.addImage({ path: ic("arrowRight", "green"), x: ax + aw / 2 - 0.12, y: ny + nh / 2 - 0.12, w: 0.24, h: 0.24 });
      s.addText("HTTPS · JSON", { x: ax - 0.24, y: ny + nh / 2 - 0.52, w: aw + 0.48, h: 0.24, fontFace: F_MONO, fontSize: 8, color: SLATE_400, align: "center" });
      s.addText("JWT", { x: ax - 0.24, y: ny + nh / 2 + 0.2, w: aw + 0.48, h: 0.24, fontFace: F_MONO, fontSize: 8, color: SLATE_400, align: "center" });
    }
  });

  const ey = 5.86;
  s.addShape("roundRect", { x: M, y: ey, w: CW, h: 0.72, rectRadius: 0.1, fill: { color: "0B2A2A" }, line: { color: "115E59", width: 1 } });
  s.addImage({ path: ic("circleCheck", "green"), x: M + 0.3, y: ey + 0.22, w: 0.28, h: 0.28 });
  s.addText("Evidência: um recurso renomeado via API apareceu, ao vivo, já atualizado no dashboard Angular.", {
    x: M + 0.72, y: ey, w: CW - 1.0, h: 0.72, fontFace: F_BODY, fontSize: 12, color: "6EE7B7", valign: "middle",
  });
  footer(s, 10, true);
}

/* ---- 11. Conclusão ------------------------------------------------------- */
{
  const s = pres.addSlide();
  bg(s, "dark");
  s.addImage({ path: `${A}/bar_accent.png`, x: 0, y: 0, w: W, h: 0.09 });

  s.addText("CONCLUSÃO", { x: M, y: 0.7, w: CW, h: 0.3, fontFace: F_TITLE, fontSize: 11.5, color: SKY_400, charSpacing: 3 });
  s.addText("De protótipo a sistema real", { x: M, y: 1.02, w: 9, h: 0.7, fontFace: F_TITLE, fontSize: 34, color: WHITE });
  s.addText("O Smart HAS deixou de ser uma interface com dados mockados e passou a ser um sistema full-stack: app React Native, backend Spring Boot com Firebase Authentication e Firestore, e dashboard Angular — os três integrados pelo mesmo contrato de API e alinhados ao conteúdo desta fase.", {
    x: M, y: 1.86, w: 11.4, h: 0.9, fontFace: F_BODY, fontSize: 13, color: SLATE_400, lineSpacingMultiple: 1.35,
  });

  const dy = 3.06, dw = (CW - 0.5) / 3, dh = 1.72;
  const entregas = [
    ["github", SKY, "Código-fonte", REPO_URL, true],
    ["youtube", RED, "Vídeo de demonstração", VIDEO_URL || "inserir link do YouTube (não listado)", !!VIDEO_URL],
    ["fileText", GREEN, "Relatório completo", "Relatorio_SmartHAS_Fase5_Cap1.pdf", true],
  ];
  entregas.forEach(([icon, color, title, value, ready], i) => {
    const x = M + i * (dw + 0.25);
    card(s, x, dy, dw, dh, { fill: NAVY_800, border: ready ? NAVY_700 : AMBER, shadow: false });
    iconChip(s, x + 0.28, dy + 0.28, 0.52, icon, color, NAVY_700);
    s.addText(title, { x: x + 0.28, y: dy + 0.92, w: dw - 0.56, h: 0.3, fontFace: F_TITLE, fontSize: 13, color: WHITE });
    s.addText(value, {
      x: x + 0.28, y: dy + 1.2, w: dw - 0.56, h: 0.42, fontFace: ready ? F_MONO : F_BODY,
      fontSize: ready ? 9.5 : 10, color: ready ? SLATE_400 : AMBER, italic: !ready, lineSpacingMultiple: 1.15,
    });
  });

  s.addShape("rect", { x: M, y: 5.28, w: CW, h: 0.012, fill: { color: NAVY_700 }, line: { type: "none" } });
  s.addText("Obrigado!", { x: M, y: 5.52, w: 6, h: 0.6, fontFace: F_TITLE, fontSize: 26, color: WHITE });
  s.addImage({ path: `${A}/avatar_yuri.png`, x: M, y: 6.24, w: 0.5, h: 0.5, rounding: true });
  s.addText(`${GROUP_NAME} · RM ${GROUP_RM}`, { x: M + 0.66, y: 6.24, w: 6, h: 0.5, fontFace: F_BODY, fontSize: 12.5, color: SLATE_400, valign: "middle" });
  s.addText("FIAP · 2026", { x: W - M - 3, y: 6.24, w: 3, h: 0.5, fontFace: F_BODY, fontSize: 11, color: NAVY_600, align: "right", valign: "middle" });
}

pres.writeFile({ fileName: "Slides_SmartHAS_Fase5_Cap1.pptx" }).then(() => console.log("slides gerados: 11"));
