# Smart HAS / ComunidadeConectada — React Native (Expo)

Migração do protótipo Flutter (`mobile/FlutterProject`) para React Native, para a Fase 5 / Cap. 1
("Mobile Hybrid App e a Sociedade 5.0") do curso FIAP. Consome o mesmo backend Spring Boot
documentado em `API_CONTRACT.md` (`http://localhost:8080/api`).

## Stack

- **Expo** (managed workflow, SDK 57)
- **React Navigation** (`@react-navigation/native-stack` para o fluxo Onboarding → Login → Main →
  Detalhe/Chat, `@react-navigation/bottom-tabs` para a barra inferior Home/Chats/Ofertar/Mapa/Perfil)
- **React Hooks + Context API** para estado (sem Redux) — `AuthContext`, `ResourceContext`,
  `ChatContext` em `src/context/`
- **TypeScript**, `StyleSheet` + Flexbox (sem biblioteca de UI de terceiros)
- `fetch` puro para o backend, `@react-native-async-storage/async-storage` para persistir o JWT
- `expo-image-picker` para a foto do recurso (preview local apenas, sem upload — ver limitações)

## Como rodar

```bash
npm install

# Emulador/dispositivo Android nativo (build de desenvolvimento):
npx expo run:android

# Ou modo Expo Go / túnel:
npx expo start

# Ou versão web (react-native-web) — usada para verificação neste ambiente:
npx expo start --web
```

O app resolve a URL do backend automaticamente (`src/config/api.ts`): `10.0.2.2:8080/api` quando
`Platform.OS === 'android'` (alias padrão do emulador Android para o localhost do host), e
`localhost:8080/api` em qualquer outra plataforma (iOS simulator, web), igual à lógica de
`lib/services/api_service.dart` no app Flutter original.

## Telas implementadas

1. **Onboarding** (`src/screens/OnboardingScreen.tsx`) — tela de intro, botão "COMEÇAR AGORA".
2. **Login/Cadastro** (`LoginScreen.tsx`) — alterna entre login e cadastro; chama
   `POST /api/auth/login` ou `POST /api/auth/register`, salva o JWT via AsyncStorage. Botão
   "ENTRAR COMO VISITANTE" cria um usuário local fake (modo Ghost) sem tocar o backend.
3. **Home** (`HomeScreen.tsx`) — saudação com o primeiro nome, busca (cosmética), lista de
   `GET /api/resources` com loading/erro/vazio tratados, cada card navega para o Detalhe ou abre
   o Chat direto.
4. **Detalhe do Recurso** (`ResourceDetailScreen.tsx`) — categoria, condição, descrição, ofertante,
   imagem (se houver) e botão "SOLICITAR RECURSO" que abre o Chat.
5. **Ofertar Recurso** (`OfferResourceScreen.tsx`) — formulário com título, descrição, chips de
   categoria/condição/tipo (mapeados para os enums do backend via `src/types/index.ts`), seletor
   de imagem local (`expo-image-picker`, sem endpoint de upload — mesma limitação do Flutter) e
   botão "Melhorar com IA" que chama o serviço Gemini/OpenRouter. Bloqueado para visitantes.
6. **Chats** (`ChatListScreen.tsx`) — lista de conversas ativas, indexadas localmente por
   `resourceId` na sessão do app (o backend agrupa mensagens por par de usuários, não por
   recurso — mesma simplificação documentada no `ChatProvider` do Flutter original).
7. **Chat por recurso** (`ChatScreen.tsx`) — carrega histórico via
   `GET /api/messages/conversation/{offerantId}?resourceId=...`, envia via `POST /api/messages`,
   bolhas "minha"/"do outro". Bloqueado para visitantes.
8. **Mapa** (`MapScreen.tsx`) — ver "Limitações" abaixo: substituído por lista ordenada por
   distância.
9. **Perfil** (`ProfileScreen.tsx`) — nome, e-mail, reputação, trocas, endereço; modal de edição
   (`PUT /api/users/me`); logout.
10. **ConectaIA** (`ChatbotScreen.tsx`) — modal acionado pelo FAB flutuante em `MainTabs.tsx`;
    chama diretamente a API do OpenRouter/Gemini a partir do cliente (`src/services/gemini.ts`),
    réplica de `lib/services/gemini_service.dart`, independente do backend Spring Boot.

## Limitações e substituições conhecidas

- **Mapa nativo → lista ordenada por distância.** A tela original em Flutter usava
  `google_maps_flutter`. Tentamos `react-native-maps` (já instalado no projeto), mas ele exige uma
  chave de API do Google Maps configurada no `AndroidManifest.xml`/build nativo para renderizar os
  tiles no Android, e não havia chave disponível neste ambiente. Em vez de deixar a tela com um
  mapa em branco (ou arriscar um crash nativo por falta de chave), `MapScreen.tsx` mostra os
  mesmos recursos com latitude/longitude, ordenados por distância até um ponto de referência
  (mesmo centro de São Paulo usado no Flutter). Para reativar o mapa nativo: adicionar a chave em
  `app.json` (`expo.android.config.googleMaps.apiKey`) e trocar a implementação por um `MapView`
  do `react-native-maps` — a lib já está instalada.
- **Upload de imagem.** Não existe endpoint de upload no backend (`API_CONTRACT.md` não documenta
  um), então a foto escolhida em "Ofertar Recurso" e no avatar do perfil fica apenas como preview
  local (URI do dispositivo) — mesma limitação conhecida do app Flutter.
- **Chave da API do ConectaIA (Gemini/OpenRouter).** Reaproveitei a mesma chave de teste do app
  Flutter (`src/services/gemini.ts`). Durante a verificação neste ambiente ela retornou
  `401 User not found` (chave expirada/revogada do lado do OpenRouter) — a integração está
  totalmente implementada e tratando erros graciosamente (mensagens amigáveis em vez de crash),
  só precisa de uma chave válida para responder de verdade. Troque `API_KEY` em
  `src/services/gemini.ts` por uma chave ativa para testar ao vivo.
- **Push notifications (Firebase Cloud Messaging).** Não implementado — exigiria credenciais
  Apple/Google Push que não estão disponíveis neste ambiente. Fica como trabalho futuro
  documentado, conforme combinado.
- **Lista de conversas por recurso.** Assim como no Flutter, é uma simplificação local por sessão
  (ver item 6 acima) — não é um bug, é a mesma modelagem adotada no app original porque o backend
  agrupa mensagens por usuário, não por recurso.

## O que foi verificado rodando de verdade

O plano original era validar num emulador Android real (`Pixel_7` via AVD, `npx expo run:android`).
**Isso não foi possível neste ambiente**: o driver de kernel do anticheat Vanguard (Riot Games),
instalado na máquina, conflita com o hypervisor que o emulador Android precisa (é um problema
conhecido, não relacionado a este código) — o emulador crashava (crashpad dump) mesmo depois de
desabilitar o Vanguard em sessão, porque o driver só é descarregado da memória com um reboot
completo, que o usuário optou por não fazer agora.

Como fallback documentado no plano original, verifiquei a aplicação via **`npx expo start --web`**
(react-native-web), rodando de verdade no navegador contra o backend Spring Boot real em
`localhost:8080` (mesma URL que o app usaria em iOS/web; no Android seria `10.0.2.2`). Passos
confirmados na sessão, clicando de verdade pela UI renderizada (não apenas lendo código):

- Onboarding → Login: navegação funciona, botão leva à tela de Login.
- Login real com o usuário seed (`yuri@exemplo.com` / `123456`) contra `POST /api/auth/login`:
  autenticou, salvou o token e navegou para Home mostrando "Olá, Yuri!".
- Home: `GET /api/resources` carregou os 3 recursos seed (Furadeira Bosch, Cadeira de Rodas,
  Livro: Dom Casmurro) com categoria/tipo/ofertante corretos.
- Toquei em um card → Detalhe do Recurso mostrou categoria "Ferramentas", condição "Excelente",
  descrição e ofertante "João Silva" corretamente traduzidos dos enums do backend.
- "SOLICITAR RECURSO" → abriu o Chat, que buscou o histórico
  (`GET /api/messages/conversation/{offerantId}`), veio vazio, e enviou automaticamente a
  mensagem inicial via `POST /api/messages` (HTTP 201) — apareceu na tela.
- Digitei e enviei uma segunda mensagem manualmente pelo campo de texto — POST confirmado (201),
  bolha apareceu na tela sem erros no console.
- Logout e novo login como **Visitante** (Ghost): saudação mudou para "Olá, Visitante!"; tentei
  publicar uma oferta vazia sem preencher nada e sem título/descrição — bloqueado corretamente
  (nenhum `POST /api/resources` disparado, confirmado inspecionando a rede).
- Aba **Ofertar**: todos os chips de Categoria (Ferramentas/Saúde/Educação/Alimentos/
  Eletrônicos/Outros), Tipo (Empréstimo/Troca/Doação) e Condição (Novo/Excelente/Boa/Regular)
  renderizaram e são selecionáveis.
- Aba **Mapa**: lista com os 3 recursos, coordenadas e distância (0.0 km / 1.2 km / 2.6 km),
  ordenada corretamente, com o aviso de substituição visível na tela.
- Aba **Perfil**: dados do visitante (reputação 0, trocas 0, endereço "Não informado"), seção
  "Meus Itens Ofertados" vazia com a mensagem correta, opções de configurações e "Sair da Conta".
- FAB **ConectaIA**: abriu o modal com a mensagem de boas-vindas; enviei uma pergunta de teste —
  a chamada HTTP para o OpenRouter disparou de verdade (visível no console/log) e retornou
  `401 User not found` (chave de teste expirada), que a UI tratou com a mensagem amigável
  "Desculpe, a IA encontrou um problema técnico (401)." em vez de travar — prova de que o
  encanamento está correto, só falta uma chave válida.
- Console do navegador sem erros reais durante toda a sessão — apenas avisos cosméticos de
  depreciação do react-native-web (`shadow*` → `boxShadow`, `pointerEvents`), que não afetam o
  funcionamento e são esperados no modo web (não existem no build nativo Android/iOS).

**Não testado neste ambiente** (por depender do build nativo Android que não pôde ser gerado):
seleção de imagem via `expo-image-picker` (a API é nativa e não funciona da mesma forma no modo
web) e o comportamento real do `react-native-maps`. O código de ambos está implementado/plugado
conforme descrito nas seções acima e deve ser testado num build Android real assim que o conflito
com o driver da Vanguard for resolvido (reiniciar a máquina após desinstalar/desabilitar
completamente o Vanguard, depois `npx expo run:android`).

## Estrutura

```
src/
  components/ResourceCard.tsx
  config/api.ts            cliente HTTP + resolução de baseUrl + token JWT
  context/                 AuthContext, ResourceContext, ChatContext (hooks)
  navigation/               RootNavigator (stack), MainTabs (bottom tabs + FAB ConectaIA)
  screens/                  as 10 telas listadas acima
  services/gemini.ts        chamada direta ao OpenRouter/Gemini (ConectaIA)
  theme/theme.ts             paleta extraída de app_theme.dart
  types/index.ts             tipos + mapeamento PT-BR ↔ enums do backend
```
