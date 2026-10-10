import { gerarDesenho } from '../../lib/desenho.js';

const resp = (status, texto) =>
  new Response(texto, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

export async function onRequest({ request, env }) {
  // 1) Método
  if (request.method !== 'POST') {
    return new Response('Método não permitido', { status: 405, headers: { Allow: 'POST' } });
  }

  // 2) Corpo
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resp(400, 'Corpo ausente ou JSON inválido');
  }
  const numero = corpo?.numero;
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    return resp(400, 'numero deve ser um inteiro entre 1 e 100');
  }

  // 3) Token
  const m = (request.headers.get('Authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!m) return resp(401, 'Token ausente');

  let info;
  try {
    const r = await fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(m[1])
    );
    if (r.status !== 200) return resp(401, 'Token inválido ou expirado');
    info = await r.json();
  } catch {
    return resp(401, 'Não foi possível verificar o token');
  }

  const clientId = (env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId || info.aud !== clientId) return resp(401, 'Token emitido para outro cliente');
  if (info.email_verified !== 'true' || !info.email) return resp(401, 'E-mail não verificado');

  // 200
  const svg = gerarDesenho(numero, info.email);
  return new Response(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } });
}
