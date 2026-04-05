const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const looiFace = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');
const input = document.getElementById('inputTexto');

// COLOQUE AQUI O SEU LINK DO CLOUDFLARE/PINGGY
const URL_TUNEL = "http://localhost:5000"; 

function verificarSenha() {
    const senha = document.getElementById('senhaInput').value;
    if (senha === "233442") {
        document.getElementById('tela-login').style.display = "none";
        document.getElementById('conteudo-robo').style.display = "flex";
        iniciarSistemas();
    } else {
        document.getElementById('erroMsg').style.display = "block";
    }
}

function iniciarSistemas() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(s => video.srcObject = s);
    roboFalar("Acesso concedido. Olá, eu sou a LOOI.");
}

function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    const vozes = window.speechSynthesis.getVoices();
    fala.voice = vozes.find(v => v.name.includes('Google')) || vozes[0];
    fala.pitch = 1.2;
    fala.onstart = () => looiMouth.classList.add('is-talking');
    fala.onend = () => looiMouth.classList.remove('is-talking');
    window.speechSynthesis.speak(fala);
}

function comunicar(texto) {
    fetch(`${URL_TUNEL}/interagir`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({texto: texto})
    })
    .then(r => r.json())
    .then(dados => {
        looiFace.className = 'face ' + dados.emocao.toLowerCase();
        roboFalar(dados.resposta);
    });
}

const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
const ouvinte = new Reconhecimento();
ouvinte.lang = 'pt-BR';
ouvinte.onresult = (e) => comunicar(e.results[0][0].transcript);

document.getElementById('btnEnviar').onclick = () => { comunicar(input.value); input.value = ""; };
document.getElementById('btnVoz').onclick = () => ouvinte.start();

setInterval(() => {
    if (video.videoWidth > 0) {
        canvas.width = 320; canvas.height = 240;
        ctx.drawImage(video, 0, 0, 320, 240);
        canvas.toBlob(blob => {
            const fd = new FormData(); fd.append('imagem', blob);
            fetch(`${URL_TUNEL}/pensar`, { method: 'POST', body: fd })
            .then(r => r.text())
            .then(emocao => { if(emocao !== "NEUTRO") looiFace.className = 'face ' + emocao.toLowerCase(); });
        }, 'image/jpeg');
    }
}, 7000);