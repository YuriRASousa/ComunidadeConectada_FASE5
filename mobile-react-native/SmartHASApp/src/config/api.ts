import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cliente HTTP central para o backend Spring Boot (Parte 2 da atividade).
 *
 * Resolve o host automaticamente: o emulador Android enxerga o localhost
 * da máquina host através do alias 10.0.2.2, então não dá para usar
 * "localhost" direto quando rodando em um emulador Android. Mesma lógica
 * de lib/services/api_service.dart no app Flutter original.
 */
export function getBaseUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api';
  }
  return 'http://localhost:8080/api';
}

const TOKEN_KEY = 'smart_has_jwt_token';

export class ApiException extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

let cachedToken: string | null | undefined;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function saveToken(token: string): Promise<void> {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function headers(auth: boolean): Promise<Record<string, string>> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = await getToken();
    if (t) h.Authorization = `Bearer ${t}`;
  }
  return h;
}

async function decode(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const text = await response.text();
  const body = isJson && text.length > 0 ? JSON.parse(text) : null;

  if (response.status >= 200 && response.status < 300) {
    return body;
  }

  const message =
    body && typeof body === 'object' && body.message
      ? String(body.message)
      : `Erro de comunicação com o servidor (HTTP ${response.status}).`;
  throw new ApiException(response.status, message);
}

function withTimeout(promise: Promise<Response>, ms = 15000): Promise<Response> {
  return Promise.race([
    promise,
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new ApiException(0, 'Tempo de conexão esgotado.')), ms)
    ),
  ]);
}

export const api = {
  async get(path: string, auth = false) {
    const response = await withTimeout(
      fetch(`${getBaseUrl()}${path}`, { method: 'GET', headers: await headers(auth) })
    );
    return decode(response);
  },
  async post(path: string, body: Record<string, any>, auth = false) {
    const response = await withTimeout(
      fetch(`${getBaseUrl()}${path}`, {
        method: 'POST',
        headers: await headers(auth),
        body: JSON.stringify(body),
      })
    );
    return decode(response);
  },
  async put(path: string, body: Record<string, any>, auth = false) {
    const response = await withTimeout(
      fetch(`${getBaseUrl()}${path}`, {
        method: 'PUT',
        headers: await headers(auth),
        body: JSON.stringify(body),
      })
    );
    return decode(response);
  },
  async delete(path: string, auth = false) {
    const response = await withTimeout(
      fetch(`${getBaseUrl()}${path}`, { method: 'DELETE', headers: await headers(auth) })
    );
    return decode(response);
  },
};
