// Réplica direta de lib/services/gemini_service.dart: chamada de cliente
// direta a um provedor compatível com a API do Gemini/OpenRouter, sem
// passar pelo backend Spring Boot. Independente do resto do app.
//
// Defina sua própria chave da OpenRouter em uma variável de ambiente do
// Expo (EXPO_PUBLIC_OPENROUTER_API_KEY, em um arquivo .env local, nunca
// commitado). Sem chave configurada, a função retorna uma mensagem
// amigável de erro em vez de travar a tela.
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '';
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'baidu/cobuddy:free';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function generateResponse(prompt: string, isTechnical = false): Promise<string> {
  try {
    const messages: any[] = [];
    if (isTechnical) {
      messages.push({
        role: 'system',
        content:
          'Você é um assistente técnico. Sua tarefa é realizar a tarefa solicitada e retornar APENAS o resultado final. Proibido usar saudações, introduções ou qualquer texto explicativo.',
      });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await withTimeout(
      fetch(BASE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://comunidadeconectada.com',
          'X-Title': 'Comunidade Conectada',
        },
        body: JSON.stringify({ model: MODEL, messages, route: 'fallback' }),
      }),
      45000
    );

    if (response.status === 200) {
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        return String(data.choices[0].message.content).trim();
      }
      return 'IA sem resposta no momento.';
    } else if (response.status === 429) {
      return 'Muitas requisições! O modelo gratuito está congestionado. Tente novamente em alguns segundos.';
    } else if (response.status >= 500) {
      return `O serviço de IA está instável ou em manutenção (Erro ${response.status}). Tente novamente.`;
    } else {
      const body = await response.text();
      console.log(`Erro OpenRouter (${response.status}): ${body}`);
      return `Desculpe, a IA encontrou um problema técnico (${response.status}).`;
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'timeout') {
      return 'A resposta demorou muito para chegar. O modelo gratuito pode estar lento agora.';
    }
    console.log('Erro de Conexão OpenRouter:', e);
    return 'Sem conexão com o serviço de IA. Verifique sua internet.';
  }
}

export async function improveDescription(description: string): Promise<string> {
  const prompt = `Melhore a seguinte descrição de doação para torná-la clara e atrativa: ${description}`;
  return generateResponse(prompt, true);
}
