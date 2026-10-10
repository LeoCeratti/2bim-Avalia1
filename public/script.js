const CLIENT_ID = '410897697705-tehirtfb0foiis8ebfu1ek5i6mn4mums.apps.googleusercontent.com'; // público, pode ficar no repositório

let idToken = null;
let svgAtual = null;

const formulario = document.getElementById('formulario');
const campoNumero = document.getElementById('numero');
const mensagem = document.getElementById('mensagem');
const desenho = document.getElementById('desenho');
const baixar = document.getElementById('baixar');

function mostrarErro(texto) {
  mensagem.textContent = texto;
  desenho.innerHTML = '';
  baixar.hidden = true;
  svgAtual = null;
}

window.addEventListener('load', () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (resposta) => {
      idToken = resposta.credential;
      mensagem.textContent = 'Login feito. Agora escolha um número e clique em Desenhar.';
    },
  });
  google.accounts.id.renderButton(
    document.getElementById('botao-google'),
    { theme: 'outline', size: 'large' }
  );
});

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensagem.textContent = '';

  const numero = Number(campoNumero.value);
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (idToken) cabecalhos.Authorization = 'Bearer ' + idToken;

  try {
    const resposta = await fetch('/api/desenho', {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      return mostrarErro('Erro 400: informe um número inteiro entre 1 e 100.');
    }
    if (resposta.status === 401) {
      const motivo = await resposta.text();
      return mostrarErro('Erro 401: faça login com o Google (a sessão pode ter expirado). [' + motivo + ']');
    }
    if (!resposta.ok) {
      return mostrarErro('Erro ' + resposta.status + ' ao gerar o desenho.');
    }

    svgAtual = await resposta.text();
    desenho.innerHTML = svgAtual;
    baixar.hidden = false;
  } catch {
    mostrarErro('Falha de rede. Tente novamente.');
  }
});

baixar.addEventListener('click', () => {
  if (!svgAtual) return;
  const blob = new Blob([svgAtual], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exemplo.svg';
  a.click();
  URL.revokeObjectURL(url);
});
