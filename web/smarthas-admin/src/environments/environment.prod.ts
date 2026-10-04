// Build de producao: a comunicacao com a API acontece sobre TLS.
// O backend correspondente sobe com o perfil "https".
export const environment = {
  production: true,
  apiUrl: 'https://localhost:8443/api',
};
