// Desenvolvimento local: o backend sobe em HTTP na porta 8080.
// Para falar com o backend em TLS, suba-o com o perfil "https" e troque
// esta URL por https://localhost:8443/api (o navegador vai pedir para
// aceitar o certificado autoassinado uma vez).
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
