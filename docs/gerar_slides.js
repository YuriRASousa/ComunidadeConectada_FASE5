const pptxgen = require("pptxgenjs");

const GROUP_NAME = "Yuri Sousa";
const GROUP_RM = "556163";

const NAVY = "0F172A";
const SKY = "0EA5E9";
const GREEN = "10B981";
const LIGHTBG = "F8FAFC";
const WHITE = "FFFFFF";
const SLATE = "475569";
const SLATE_LIGHT = "94A3B8";

const ICONS = "pptx_assets";

function newDeck() {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
  return p;
}

function iconCircle(slide, x, y, d, icon, bg) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: bg }, line: { type: "none" } });
  const pad = d * 0.24;
  slide.addImage({ path: `${ICONS}/${icon}.png`, x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
}

function footer(slide, n) {
  slide.addText("Smart HAS · Fase 5 · Cap. 1", {
    x: 0.5, y: 7.15, w: 6, h: 0.3, fontFace: "Calibri", fontSize: 10, color: SLATE_LIGHT,
  });
  slide.addText(String(n), {
    x: 12.5, y: 7.15, w: 0.4, h: 0.3, fontFace: "Calibri", fontSize: 10, color: SLATE_LIGHT, align: "right",
  });
}

const pres = newDeck();

// ---------- Slide 1: Capa ----------
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  iconCircle(s, 11.2, 0.6, 1.7, "network", "1E293B");
  s.addText("Smart HAS", {
    x: 0.8, y: 2.3, w: 10, h: 1.1, fontFace: "Cambria", fontSize: 48, bold: true, color: WHITE,
  });
  s.addText("ComunidadeConectada", {
    x: 0.8, y: 3.15, w: 10, h: 0.6, fontFace: "Calibri", fontSize: 22, color: SKY,
  });
  s.addText("Fase 5 · Capítulo 1 — Mobile Hybrid App e a Sociedade 5.0", {
    x: 0.8, y: 3.85, w: 10.5, h: 0.5, fontFace: "Calibri", fontSize: 16, color: SLATE_LIGHT,
  });
  s.addShape("roundRect", {
    x: 0.8, y: 5.5, w: 5.6, h: 1.4, rectRadius: 0.1, fill: { color: "1E293B" }, line: { type: "none" },
  });
  s.addText([
    { text: "Integrante: ", options: { color: SLATE_LIGHT, fontSize: 14 } },
    { text: GROUP_NAME, options: { color: WHITE, fontSize: 14, bold: true, breakLine: true } },
    { text: "RM: ", options: { color: SLATE_LIGHT, fontSize: 14 } },
    { text: GROUP_RM, options: { color: WHITE, fontSize: 14, bold: true } },
  ], { x: 1.1, y: 5.7, w: 5, h: 1 });
  s.addText("FIAP — 2026", { x: 0.8, y: 7.0, w: 4, h: 0.35, fontFace: "Calibri", fontSize: 12, color: SLATE_LIGHT });
}

// ---------- Slide 2: O que é o Smart HAS ----------
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addText("O que é o Smart HAS", { x: 0.6, y: 0.5, w: 10, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY });
  s.addText("Um app híbrido de economia colaborativa para a Sociedade 5.0", {
    x: 0.6, y: 1.15, w: 10.5, h: 0.5, fontFace: "Calibri", fontSize: 16, color: SLATE,
  });

  const rows = [
    ["users", "Comunidade conectada", "Pessoas oferecem e pedem recursos — ferramentas, saúde, livros, alimentos — por empréstimo, troca ou doação."],
    ["map", "Geolocalização", "Recursos aparecem no mapa por proximidade, facilitando encontros presenciais na vizinhança."],
    ["message", "ConectaIA", "Assistente de IA (Gemini) ajuda a melhorar descrições de ofertas e tira dúvidas dos usuários em tempo real."],
  ];
  let y = 2.1;
  for (const [icon, title, desc] of rows) {
    iconCircle(s, 0.7, y, 0.9, icon, SKY);
    s.addText(title, { x: 1.9, y: y - 0.02, w: 10.3, h: 0.4, fontFace: "Calibri", fontSize: 18, bold: true, color: NAVY });
    s.addText(desc, { x: 1.9, y: y + 0.4, w: 10.3, h: 0.6, fontFace: "Calibri", fontSize: 13.5, color: SLATE });
    y += 1.55;
  }
  footer(s, 2);
}

// ---------- Slide 3: Ponto de partida ----------
{
  const s = pres.addSlide();
  s.background = { color: LIGHTBG };
  s.addText("O ponto de partida (Fase 4)", { x: 0.6, y: 0.5, w: 11, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY });
  s.addText("Um protótipo Flutter completo na interface — mas sem nenhum dado real por trás", {
    x: 0.6, y: 1.15, w: 11.5, h: 0.5, fontFace: "Calibri", fontSize: 16, color: SLATE,
  });

  s.addShape("roundRect", { x: 0.6, y: 2.1, w: 5.9, h: 4.6, rectRadius: 0.12, fill: { color: WHITE }, shadow: { type: "outer", color: "000000", opacity: 0.15, blur: 8, offset: 3, angle: 90 }, line: { type: "none" } });
  s.addText("O que já existia", { x: 1.0, y: 2.4, w: 5, h: 0.4, fontFace: "Calibri", fontSize: 16, bold: true, color: GREEN });
  s.addText([
    { text: "11 telas funcionais: onboarding, login, home, mapa, chat, chatbot, oferta, perfil", options: { bullet: true, breakLine: true, color: SLATE, fontSize: 13.5 } },
    { text: "Arquitetura com Provider/ChangeNotifier", options: { bullet: true, breakLine: true, color: SLATE, fontSize: 13.5 } },
    { text: "Integração com IA (Gemini) para chat", options: { bullet: true, breakLine: true, color: SLATE, fontSize: 13.5 } },
    { text: "UI consistente e responsiva", options: { bullet: true, color: SLATE, fontSize: 13.5 } },
  ], { x: 1.0, y: 2.9, w: 5.2, h: 3.5, paraSpaceAfter: 10 });

  s.addShape("roundRect", { x: 6.8, y: 2.1, w: 5.9, h: 4.6, rectRadius: 0.12, fill: { color: WHITE }, shadow: { type: "outer", color: "000000", opacity: 0.15, blur: 8, offset: 3, angle: 90 }, line: { type: "none" } });
  s.addText("O que faltava", { x: 7.2, y: 2.4, w: 5, h: 0.4, fontFace: "Calibri", fontSize: 16, bold: true, color: "DC2626" });
  s.addText([
    { text: "Usuários, recursos e mensagens 100% mockados em memória", options: { bullet: true, breakLine: true, color: SLATE, fontSize: 13.5 } },
    { text: "Nada persistia — reiniciar o app apagava tudo", options: { bullet: true, breakLine: true, color: SLATE, fontSize: 13.5 } },
    { text: "Sem autenticação real, sem backend, sem banco de dados", options: { bullet: true, breakLine: true, color: SLATE, fontSize: 13.5 } },
    { text: "Botão \"Publicar Oferta\" nem sequer salvava o recurso", options: { bullet: true, color: SLATE, fontSize: 13.5 } },
  ], { x: 7.2, y: 2.9, w: 5.2, h: 3.5, paraSpaceAfter: 10 });
  footer(s, 3);
}

// ---------- Slide 4: Decisão de stack ----------
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addText("Parte 1 — Escolha da Stack Mobile", { x: 0.6, y: 0.5, w: 11, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: NAVY });

  s.addShape("roundRect", { x: 0.6, y: 1.5, w: 5.9, h: 5.2, rectRadius: 0.12, fill: { color: LIGHTBG }, line: { color: GREEN, width: 2 } });
  iconCircle(s, 0.95, 1.8, 0.7, "check", GREEN);
  s.addText("React Native (escolhido)", { x: 1.85, y: 1.9, w: 4.5, h: 0.5, fontFace: "Calibri", fontSize: 16, bold: true, color: NAVY });
  s.addText([
    { text: "5 dos 13 capítulos da fase são só sobre React Native", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "Opção A do enunciado pede View/Text/Image/Button + React Navigation, ao pé da letra", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "Node.js já disponível; Expo permite montar e testar rápido", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "Hooks (useState/useEffect) e AsyncStorage seguindo os padrões dos Cap. 05 e 06", options: { bullet: true, fontSize: 12.5, color: SLATE } },
  ], { x: 1.0, y: 2.6, w: 5.2, h: 3.9, paraSpaceAfter: 8 });

  s.addShape("roundRect", { x: 6.8, y: 1.5, w: 5.9, h: 5.2, rectRadius: 0.12, fill: { color: "F1F5F9" }, line: { type: "none" } });
  iconCircle(s, 7.15, 1.8, 0.7, "code", SLATE_LIGHT);
  s.addText("Flutter (versão anterior)", { x: 8.05, y: 1.9, w: 4.5, h: 0.5, fontFace: "Calibri", fontSize: 16, bold: true, color: SLATE });
  s.addText([
    { text: "11 telas da Fase 4, já integradas ao backend real", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "Mantida no repositório como histórico do projeto", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "Não usa nenhum conteúdo específico ensinado nesta fase", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "Base de referência para comparar a migração", options: { bullet: true, fontSize: 12.5, color: SLATE } },
  ], { x: 8.2, y: 2.6, w: 4.3, h: 3.9, paraSpaceAfter: 8 });
  footer(s, 4);
}

// ---------- Slide 5: Roadmap ----------
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addText("Roadmap Tecnológico", { x: 0.6, y: 0.5, w: 10, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: WHITE });

  const steps = [
    ["flag", "Fases 1–4", "Escopo, arquitetura e protótipo Flutter\ncom dados mockados", GREEN],
    ["target", "Fase 5 · Cap. 1 (agora)", "Backend Spring Boot real, integração\nmobile + dashboard Angular", SKY],
    ["refresh", "Próximas fases", "Upload de imagens, sessão persistente,\nIA de logística, deploy em nuvem", "64748B"],
  ];
  let x = 0.7;
  const w = 3.9;
  steps.forEach(([icon, title, desc, color], i) => {
    s.addShape("roundRect", { x, y: 2.1, w, h: 4.4, rectRadius: 0.12, fill: { color: "1E293B" }, line: { type: "none" } });
    iconCircle(s, x + w / 2 - 0.5, 2.5, 1.0, icon, color);
    s.addText(title, { x: x + 0.2, y: 3.75, w: w - 0.4, h: 0.5, align: "center", fontFace: "Calibri", fontSize: 16, bold: true, color: WHITE });
    s.addText(desc, { x: x + 0.35, y: 4.3, w: w - 0.7, h: 1.8, align: "center", fontFace: "Calibri", fontSize: 12.5, color: SLATE_LIGHT });
    if (i < 2) {
      s.addText("→", { x: x + w - 0.05, y: 3.9, w: 0.5, h: 0.6, fontSize: 24, color: SLATE_LIGHT, align: "center" });
    }
    x += w + 0.35;
  });
  footer(s, 5);
}

// ---------- Slide 6: Backend Spring Boot ----------
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addText("Parte 2 — Backend Spring Boot", { x: 0.6, y: 0.5, w: 11, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: NAVY });
  s.addText("Java 21 · Spring Boot 4 · Firebase (Cap. 13) · API REST completa para o app e o dashboard", {
    x: 0.6, y: 1.15, w: 11.5, h: 0.5, fontFace: "Calibri", fontSize: 15, color: SLATE,
  });

  const cards = [
    ["lock", "Firebase Authentication", "Cadastro/login reais; senha nunca fica no backend"],
    ["database", "Firestore", "Banco NoSQL na nuvem, CRUD completo"],
    ["layers", "3 entidades", "User, Resource e Message, com DTOs dedicados"],
    ["server", "Controller → Service → Repository", "Camadas bem definidas, injeção por construtor"],
    ["check", "Tratamento de erros padrão", "400 / 401 / 403 / 404 / 409 em formato único"],
    ["globe", "Swagger / OpenAPI", "Documentação interativa em /swagger-ui"],
  ];
  let cx = 0.6, cy = 2.1;
  cards.forEach(([icon, title, desc], i) => {
    if (i > 0 && i % 3 === 0) { cx = 0.6; cy += 2.35; }
    s.addShape("roundRect", { x: cx, y: cy, w: 3.85, h: 2.15, rectRadius: 0.1, fill: { color: LIGHTBG }, line: { type: "none" } });
    iconCircle(s, cx + 0.25, cy + 0.25, 0.65, icon, SKY);
    s.addText(title, { x: cx + 0.25, y: cy + 1.0, w: 3.4, h: 0.5, fontFace: "Calibri", fontSize: 13.5, bold: true, color: NAVY });
    s.addText(desc, { x: cx + 0.25, y: cy + 1.45, w: 3.4, h: 0.65, fontFace: "Calibri", fontSize: 11, color: SLATE });
    cx += 4.1;
  });
  footer(s, 6);
}

// ---------- Slide 7: Endpoints & verificação ----------
{
  const s = pres.addSlide();
  s.background = { color: LIGHTBG };
  s.addText("API REST — Cobertura e Verificação", { x: 0.6, y: 0.5, w: 11.5, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: NAVY });

  const stats = [["18", "endpoints REST"], ["3", "entidades persistidas"], ["100%", "testado via curl ponta a ponta"]];
  let x = 0.6;
  stats.forEach(([num, label]) => {
    s.addShape("roundRect", { x, y: 1.5, w: 3.9, h: 1.7, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
    s.addText(num, { x, y: 1.6, w: 3.9, h: 0.9, align: "center", fontFace: "Calibri", fontSize: 40, bold: true, color: SKY });
    s.addText(label, { x, y: 2.5, w: 3.9, h: 0.5, align: "center", fontFace: "Calibri", fontSize: 13, color: WHITE });
    x += 4.15;
  });

  s.addText("Principais rotas", { x: 0.6, y: 3.5, w: 5, h: 0.4, fontFace: "Calibri", fontSize: 15, bold: true, color: NAVY });
  s.addText([
    { text: "POST /api/auth/register, /api/auth/login", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "GET/PUT /api/users/me · GET/DELETE /api/users (ADMIN)", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "GET/POST/PUT/DELETE /api/resources", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "GET/POST /api/messages, /api/messages/conversations", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "GET /api/admin/stats (ADMIN)", options: { bullet: true, fontSize: 12.5, color: SLATE } },
  ], { x: 0.6, y: 3.95, w: 6, h: 2.8, paraSpaceAfter: 6 });

  s.addText("Verificado de verdade", { x: 7.1, y: 3.5, w: 5, h: 0.4, fontFace: "Calibri", fontSize: 15, bold: true, color: NAVY });
  s.addText([
    { text: "Servidor compilado e rodando localmente (./mvnw spring-boot:run)", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "Cadastro real no Firebase Auth + login com as mesmas credenciais, em chamadas separadas", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "Regras de permissão dono-vs-admin conferidas na prática", options: { bullet: true, breakLine: true, fontSize: 12.5, color: SLATE } },
    { text: "Bug real no SDK do Firebase (\"Not in GZIP format\") encontrado e contornado", options: { bullet: true, fontSize: 12.5, color: SLATE } },
  ], { x: 7.1, y: 3.95, w: 5.6, h: 2.8, paraSpaceAfter: 6 });
  footer(s, 7);
}

// ---------- Slide 8: Dashboard Angular ----------
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addText("Parte 3 — Dashboard Angular", { x: 0.6, y: 0.5, w: 11, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: NAVY });
  s.addText("Painel administrativo consumindo a mesma API do app mobile", {
    x: 0.6, y: 1.15, w: 11.5, h: 0.5, fontFace: "Calibri", fontSize: 15, color: SLATE,
  });

  const rows = [
    ["layout", "Rotas", "/home (pública), /login e /admin (protegida por AuthGuard)"],
    ["lock", "HttpClient + Interceptor", "Anexa automaticamente o token JWT em toda chamada à API"],
    ["code", "4 formas de binding", "{{ }} interpolação · [ ] property · ( ) evento · [( )] ngModel"],
    ["check", "*ngIf / *ngFor", "Estados de carregamento/erro/vazio e listas de usuários e recursos"],
  ];
  let y = 2.15;
  for (const [icon, title, desc] of rows) {
    iconCircle(s, 0.7, y, 0.85, icon, GREEN);
    s.addText(title, { x: 1.85, y: y, w: 4.5, h: 0.4, fontFace: "Calibri", fontSize: 16, bold: true, color: NAVY });
    s.addText(desc, { x: 1.85, y: y + 0.4, w: 10, h: 0.5, fontFace: "Calibri", fontSize: 12.5, color: SLATE });
    y += 1.2;
  }
  footer(s, 8);
}

// ---------- Slide 9: Integração ponta a ponta ----------
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addText("Integração Ponta a Ponta", { x: 0.6, y: 0.5, w: 11, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: WHITE });
  s.addText("As três aplicações compartilham o mesmo contrato de API e os mesmos dados reais", {
    x: 0.6, y: 1.15, w: 11.5, h: 0.5, fontFace: "Calibri", fontSize: 15, color: SLATE_LIGHT,
  });

  const boxes = [
    ["smartphone", "App React Native", "Login, ofertas e chat\nconsumindo a API"],
    ["server", "API Spring Boot + Firebase", "Autenticação, regras de\nnegócio e persistência"],
    ["layout", "Dashboard Angular", "Gestão e estatísticas\nem tempo real"],
  ];
  let x = 0.9;
  const w = 3.5;
  boxes.forEach(([icon, title, desc], i) => {
    s.addShape("roundRect", { x, y: 2.6, w, h: 3.4, rectRadius: 0.12, fill: { color: "1E293B" }, line: { type: "none" } });
    iconCircle(s, x + w / 2 - 0.5, 2.95, 1.0, icon, SKY);
    s.addText(title, { x: x + 0.2, y: 4.15, w: w - 0.4, h: 0.5, align: "center", fontFace: "Calibri", fontSize: 15, bold: true, color: WHITE });
    s.addText(desc, { x: x + 0.3, y: 4.65, w: w - 0.6, h: 1.1, align: "center", fontFace: "Calibri", fontSize: 11.5, color: SLATE_LIGHT });
    if (i < 2) s.addText("↔", { x: x + w + 0.15, y: 3.9, w: 0.6, h: 0.6, fontSize: 26, color: GREEN, align: "center" });
    x += w + 0.75;
  });
  s.addText("Evidência: um recurso renomeado via API apareceu, ao vivo, atualizado no dashboard Angular.", {
    x: 0.9, y: 6.35, w: 11.4, h: 0.5, align: "center", italic: true, fontFace: "Calibri", fontSize: 12.5, color: SLATE_LIGHT,
  });
  footer(s, 9);
}

// ---------- Slide 10: Conclusão ----------
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addText("Conclusão", { x: 0.6, y: 0.6, w: 8, h: 0.7, fontFace: "Cambria", fontSize: 34, bold: true, color: WHITE });
  s.addText(
    "O Smart HAS saiu de um protótipo Flutter com dados mockados para um sistema full-stack real e alinhado ao conteúdo da fase: app React Native, backend Spring Boot com Firebase (Authentication + Firestore), e dashboard Angular — todos integrados pelo mesmo contrato de API.",
    { x: 0.6, y: 1.5, w: 11.8, h: 1.1, fontFace: "Calibri", fontSize: 15, color: SLATE_LIGHT }
  );

  s.addShape("roundRect", { x: 0.6, y: 2.9, w: 11.8, h: 2.1, rectRadius: 0.1, fill: { color: "1E293B" }, line: { type: "none" } });
  s.addText("Entregáveis desta atividade", { x: 0.95, y: 3.1, w: 6, h: 0.4, fontFace: "Calibri", fontSize: 15, bold: true, color: SKY });
  s.addText([
    { text: "Código-fonte: GitHub — [link a inserir]", options: { bullet: true, breakLine: true, fontSize: 12.5, color: WHITE } },
    { text: "Vídeo de demonstração (YouTube não listado) — [link a inserir]", options: { bullet: true, breakLine: true, fontSize: 12.5, color: WHITE } },
    { text: "Relatório completo em PDF (documento em anexo)", options: { bullet: true, fontSize: 12.5, color: WHITE } },
  ], { x: 0.95, y: 3.55, w: 11, h: 1.3, paraSpaceAfter: 6 });

  s.addText("Obrigado!", { x: 0.6, y: 5.4, w: 6, h: 0.6, fontFace: "Cambria", fontSize: 22, bold: true, color: WHITE });
  s.addText(`${GROUP_NAME} · RM ${GROUP_RM}`, { x: 0.6, y: 6.0, w: 8, h: 0.4, fontFace: "Calibri", fontSize: 13, color: SLATE_LIGHT });
  footer(s, 10);
}

pres.writeFile({ fileName: "Slides_SmartHAS_Fase5_Cap1.pptx" }).then(() => console.log("done"));
