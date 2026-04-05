// ATUALIZA COM O LINK DO TEU LOCALTUNNEL
const URL_LOCAL = "https://looi-robot.loca.lt"; 

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const looiFace = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');
const input = document.getElementById('inputTexto');

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
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(s => video.srcObject = s);
    roboFalar("Acesso concedido. Iniciando visão da Looi.");
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
    if (!texto) return;
    
    // Tira foto para o Moondream analisar junto com o texto
    canvas.width = 320; canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 320, 240);
    
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
        });
    }, 'image/jpeg');
}

// Configuração de Voz
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
const ouvinte = new Reconhecimento();
ouvinte.lang = 'pt-BR';
ouvinte.onresult = (e) => comunicar(e.results[0][0].transcript);

document.getElementById('btnEnviar').onclick = () => { comunicar(input.value); input.value = ""; };
document.getElementById('btnVoz').onclick = () => ouvinte.start();

// VISÃO AUTOMÁTICA (1 SEGUNDO)
setInterval(() => {
    if (video.videoWidth > 0 && document.getElementById('tela-login').style.display === "none") {
        canvas.width = 320; canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 320, 240);
        
        canvas.toBlob(blob => {
            const fd = new FormData();
            fd.append('imagem', blob);
            fetch(`${URL_LOCAL}/interagir`, { method: 'POST', body: fd })
            .then(r => r.json())
            .then(dados => {
                if(dados.emocao !== "NEUTRO") looiFace.className = 'face ' + dados.emocao.toLowerCase();
            });
        }, 'image/jpeg');
    }
}, 1000);
