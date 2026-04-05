// ATENÇÃO: Mude este link para o link que o terminal 'lt' te deu hoje!
const URL_LOCAL = "https://looi-robot.loca.lt"; 

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const looiFace = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');

function verificarSenha() {
    if (document.getElementById('senhaInput').value === "233442") {
        document.getElementById('tela-login').style.display = "none";
        document.getElementById('conteudo-robo').style.display = "flex";
        iniciarSistemas();
    } else {
        document.getElementById('erroMsg').style.display = "block";
    }
}

function iniciarSistemas() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(s => { video.srcObject = s; console.log("Câmera e Áudio Ativos!"); })
        .catch(e => alert("Ligue a câmera e o microfone nas configurações do navegador!"));
}

function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.onstart = () => looiMouth.classList.add('is-talking');
    fala.onend = () => looiMouth.classList.remove('is-talking');
    window.speechSynthesis.speak(fala);
}

// FUNÇÃO PARA ENVIAR TUDO (TEXTO E ÁUDIO)
function comunicar(texto) {
    if (!texto) return;
    console.log("Enviando texto: " + texto);

    // Tira uma foto rápida para o Moondream ver o contexto
    canvas.width = 320; canvas.height = 240;
    canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
    
    canvas.toBlob(blob => {
        const fd = new FormData();
        fd.append('texto', texto);
        fd.append('imagem', blob);

        fetch(`${URL_LOCAL}/interagir`, {
            method: 'POST',
            body: fd
        })
        .then(r => r.json())
        .then(dados => {
            looiFace.className = 'face ' + dados.emocao.toLowerCase();
            roboFalar(dados.resposta);
        })
        .catch(err => {
            console.error("Erro de conexão:", err);
            // Se cair aqui, o link do LocalTunnel está errado ou o Python está desligado
            roboFalar("Não consigo falar com o meu computador central.");
        });
    }, 'image/jpeg');
}

// BOTÃO DE ENVIAR TEXTO
document.getElementById('btnEnviar').onclick = () => {
    const txt = document.getElementById('inputTexto').value;
    comunicar(txt);
    document.getElementById('inputTexto').value = "";
};

// BOTÃO DE ÁUDIO
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Reconhecimento) {
    const ouvinte = new Reconhecimento();
    ouvinte.lang = 'pt-BR';
    ouvinte.onresult = (e) => {
        const transcricao = e.results[0][0].transcript;
        console.log("Ouvi áudio: " + transcricao);
        comunicar(transcricao);
    };
    document.getElementById('btnVoz').onclick = () => ouvinte.start();
}
