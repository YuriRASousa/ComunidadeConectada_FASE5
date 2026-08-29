const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType,
} = require("docx");
const fs = require("fs");

const PAGE = { size: { width: 11906, height: 16838 } }; // A4

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 } });
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 100 } });
}
function bullet(text, opts = {}) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 }, ...opts });
}
function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: "0F172A" } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: !!opts.header || !!opts.bold, color: opts.header ? "FFFFFF" : undefined, size: opts.size || 20, italics: !!opts.italics })],
    })],
  });
}

function roteiroRow(tempo, slide, fala) {
  const widths = [1100, 1500, 7306];
  return new TableRow({
    children: [
      cell(tempo, { width: widths[0], bold: true }),
      cell(slide, { width: widths[1], bold: true }),
      cell(fala, { width: widths[2], italics: true }),
    ],
  });
}

function roteiroHeader() {
  const widths = [1100, 1500, 7306];
  return new TableRow({
    children: [
      cell("Tempo", { header: true, width: widths[0] }),
      cell("Slide", { header: true, width: widths[1] }),
      cell("O que falar", { header: true, width: widths[2] }),
    ],
  });
}

const doc = new Document({
  sections: [{
    properties: { page: PAGE },
    children: [
      new Paragraph({
        children: [new TextRun({ text: "Roteiro de Apresentação — Vídeo (até 5 min)", bold: true, size: 34 })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Smart HAS — ComunidadeConectada · Fase 5, Capítulo 1 · Yuri Sousa (RM 556163)", size: 22, color: "475569" })],
        spacing: { after: 300 },
      }),

      h1("Antes de gravar"),
      bullet("Grave a tela cheia com áudio do microfone (Windows: Xbox Game Bar — Win+G — ou OBS Studio, gratuito). Teste o áudio 5 segundos antes."),
      bullet("Deixe abertos, em abas/janelas separadas, prontos pra alternar: (1) os slides em PDF ou PowerPoint em modo apresentação, (2) o navegador com o painel Angular (localhost:4200) já logado como admin, (3) o navegador com o app mobile (localhost:8081) na tela de Onboarding, (4) opcionalmente o Swagger (localhost:8080/swagger-ui/index.html)."),
      bullet("Rode `iniciar_projeto.bat` uns 2 minutos antes de começar a gravar, pra dar tempo do backend subir."),
      bullet("O roteiro abaixo soma ~5 minutos. Fale com calma — é melhor cortar uma frase do que falar correndo. Os tempos são um guia, não um cronômetro rígido."),
      bullet("No final, publique o vídeo no YouTube como \"Não listado\" (não Privado — o professor precisa conseguir abrir o link) e cole o link no documento e nos slides."),

      h1("Parte 1 — Slides (≈ 2min45)"),
      new Table({
        width: { size: 9906, type: WidthType.DXA },
        columnWidths: [1100, 1500, 7306],
        rows: [
          roteiroHeader(),
          roteiroRow("0:00", "Slide 1\n(Capa)",
            "\"Oi, meu nome é Yuri Sousa, RM 556163, e esse é o Smart HAS, o ComunidadeConectada — o trabalho da Fase 5, Capítulo 1, sobre Mobile Hybrid App e a Sociedade 5.0.\""),
          roteiroRow("0:15", "Slide 2\n(O que é)",
            "\"O Smart HAS é um app de economia colaborativa: as pessoas oferecem e pedem recursos — ferramentas, itens de saúde, livros — por empréstimo, troca ou doação. Ele tem geolocalização pra mostrar o que tem perto de você, e um assistente de IA, o ConectaIA, que ajuda a melhorar as descrições e tira dúvidas.\""),
          roteiroRow("0:40", "Slide 3\n(Ponto de partida)",
            "\"A gente já vinha desse projeto desde a Fase 4, em Flutter — com 11 telas prontas, mas com um problema: tudo era mockado. Reiniciar o app apagava tudo, não tinha backend, não tinha autenticação real. Era isso que eu precisava resolver nesta fase.\""),
          roteiroRow("1:00", "Slide 4\n(Stack mobile)",
            "\"Pra Parte 1, eu migrei o app de Flutter pra React Native. Não foi por acaso: 5 dos 13 capítulos dessa fase são inteiramente sobre React Native, então migrar foi a forma de aplicar o que foi ensinado, em vez de só ler a teoria. O Flutter da Fase 4 continua no repositório como referência.\""),
          roteiroRow("1:18", "Slide 5\n(Roadmap)",
            "\"Esse é o roadmap: as Fases 1 a 4 entregaram o protótipo em Flutter. Nesta atividade entram o backend real, a migração pro React Native e o painel Angular. Pra frente ficam upload de imagem, notificações push e sessão persistente.\""),
          roteiroRow("1:33", "Slide 6\n(App React Native)",
            "\"E esse é o app já rodando: login com conta real no Firebase, a Home puxando os recursos direto da API, o mapa com Leaflet e OpenStreetMap, e o ConectaIA. Tudo com os componentes nativos do React Native — View, Text, Image, Button e FlatList — e navegação com React Navigation.\""),
          roteiroRow("1:48", "Slides 7 e 8\n(Backend)",
            "\"Pra Parte 2, o backend é Spring Boot com Java 21. Autenticação e senha ficam por conta do Firebase Authentication, e os dados — usuários, recursos e mensagens — ficam no Firestore. Segui a arquitetura Controller, Service e Repository, com tratamento de erro padronizado e documentação no Swagger. São 18 endpoints ao todo, e eu testei ponta a ponta com curl — inclusive achei e corrigi dois bugs reais durante esse teste, que estão documentados no relatório.\""),
          roteiroRow("2:20", "Slide 9\n(Angular)",
            "\"Pra Parte 3, o painel administrativo é em Angular, consumindo essa mesma API REST. Ele usa HttpClient com um interceptor que anexa o token JWT automaticamente, e aplica as quatro formas de data binding pedidas — interpolação, property binding, event binding e two-way binding com ngModel — além das diretivas ngIf e ngFor nas listas e tabelas.\""),
          roteiroRow("2:40", "Slide 10\n(Integração)",
            "\"E o ponto principal: as três aplicações — o app em React Native, o backend e o painel Angular — falam com o mesmo contrato de API e os mesmos dados reais. Deixa eu mostrar isso funcionando de verdade.\""),
        ],
      }),

      h1("Parte 2 — Demonstração ao vivo (≈ 2min00)"),
      p("Alterne para as janelas do navegador. Fale enquanto navega, sem pausa longa de silêncio.", { italics: true, color: "475569" }),
      new Table({
        width: { size: 9906, type: WidthType.DXA },
        columnWidths: [1100, 1500, 7306],
        rows: [
          roteiroHeader(),
          roteiroRow("2:45", "Painel\nAngular",
            "\"Aqui é o painel admin, já logado. Dá pra ver as estatísticas gerais, os recursos por categoria, a lista de usuários e de recursos — tudo vindo direto da API.\" [Mostre a tela de estatísticas e role até a tabela de usuários/recursos]"),
          roteiroRow("3:05", "Criar\nrecurso",
            "\"E eu consigo criar um recurso novo por aqui mesmo, com esse formulário — usando ngModel pra ligar os campos.\" [Preencha título/descrição e clique em Criar recurso; mostre ele aparecendo na lista]"),
          roteiroRow("3:25", "App mobile\n(login)",
            "\"Agora o app mobile, em React Native. Essa é a tela inicial, e aqui eu entro com uma conta real.\" [Faça login com yuri@exemplo.com / 123456]"),
          roteiroRow("3:40", "Home +\nrecursos",
            "\"Na Home já aparecem os recursos vindos do backend, com foto de verdade. Se eu abrir um...\" [Toque em um recurso] \"...vejo os detalhes, e daqui dá pra abrir uma conversa com quem ofereceu.\" [Abra o chat e mande uma mensagem]"),
          roteiroRow("4:05", "Mapa",
            "\"Na aba Mapa, os recursos aparecem geolocalizados, com um mapa interativo de verdade — dá pra arrastar, dar zoom e tocar nos pinos.\" [Abra a aba Mapa e toque em um pino]"),
          roteiroRow("4:20", "ConectaIA",
            "\"E esse botão flutuante abre o ConectaIA, nosso assistente de IA, que responde de verdade usando a API do Gemini.\" [Abra o chat e mande uma pergunta simples, espere a resposta aparecer]"),
          roteiroRow("4:40", "Perfil",
            "\"Por fim, o perfil do usuário, com avatar, reputação e histórico de trocas.\" [Abra a aba Perfil]"),
        ],
      }),

      h1("Parte 3 — Fechamento (≈ 0min15)"),
      p("\"Isso resume o Smart HAS nesta fase: saiu de um protótipo mockado pra um sistema completo, com app, backend e painel web integrados de verdade. Muito obrigado!\"", { italics: true }),

      h1("Checklist final"),
      bullet("Vídeo com no máximo 5 minutos, mostrando os slides E o app rodando de verdade (obrigatório pelo enunciado)."),
      bullet("Upload no YouTube como \"Não listado\" — nunca \"Privado\"."),
      bullet("Colar o link do vídeo no relatório (Word/PDF) e nos slides."),
      bullet("Conferir se o ZIP final tem: relatório em PDF, link/código do GitHub, slides em PDF, e o link do vídeo."),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Roteiro_Apresentacao_SmartHAS.docx", buffer);
  console.log("done");
});
