// Ligar a "torneira de dados" do Socket.IO para o teu LocalTunnel
const socket = io("https://looi-robot.loca.lt", {
    extraHeaders: { "Bypass-Tunnel-Reminder": "true" }
});

let ocupada = false;
let textoVoz = "";

const looiFace = document.getElementById('looi-face');
const input = document.getElementById('inputTexto');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

// 1. LOGIN E HARDWARE
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
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true })
        .then(s => {
            video.srcObject = s;
            iniciarVisaoLive(); // Inicia o streaming de vídeo
        });
    roboFalar("Sistemas Live VLM ativos. Estou a ver tudo!");
}

// 2. VISÃO CONTÍNUA (LIVE VLM)
function iniciarVisaoLive() {
    setInterval(() => {
        // Envia frames para o Python a cada 1 segundo em baixa resolução
        if (!ocupada && video.videoWidth > 0 && document.getElementById('conteudo-robo').style.display !== "none") {
            // Tira uma foto pequena (160px) para ser ultra fluido
            canvas.width = 160; canvas.height = 120;
            canvas.getContext('2d').drawImage(video, 0, 0, 160, 120);
            
            const frameData = canvas.toDataURL('image/jpeg', 0.5); // Qualidade 0.5 para não lagar o túnel
            socket.emit('stream_frame', frameData); // Envia pelo túnel aberto
        }
    }, 1000); // 1 frame por segundo é o ideal para o LocalTunnel aguentar
}

function toggleFullScreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

// 3. VOZ COM CONFIRMAÇÃO
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const ouvinte = Rec ? new Rec() : null;

if (ouvinte) {
    ouvinte.lang = 'pt-BR';
    ouvinte.onstart = () => { document.body.style.boxShadow = "inset 0 0 50px #00f7ff"; };
    ouvinte.onend = () => { document.body.style.boxShadow = "none"; };
    
    ouvinte.onresult = (e) => {
        textoVoz = e.results[0][0].transcript;
        input.value = textoVoz;
        // Mostra o botão de confirmar no meio da tela
        document.getElementById('container-confirmar').style.display = "block";
    };
}

function ativarVoz() { if (ouvinte && !ocupada) { textoVoz = ""; ouvinte.start(); } }

function confirmarEnvio() {
    if (textoVoz !== "") {
        // Em vez de usar fetch, envia pelo Socket
        socket.emit('chat_live', textoVoz);
        document.getElementById('container-confirmar').style.display = "none";
    }
}

function enviarTexto() { 
    if (input.value !== "") {
        socket.emit('chat_live', input.value);
        input.value = ""; 
    }
}

// 4. RECEBER RESPOSTAS DO PYTHON E FALAR
socket.on('ai_answer', (dados) => {
    looiFace.className = 'face ' + dados.emocao.toLowerCase();
    roboFalar(dados.resposta);
});

function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const f = new SpeechSynthesisUtterance(texto);
    f.lang = 'pt-BR';
    f.onstart = () => { ocupada = true; looiFace.classList.add('is-talking'); };
    f.onend = () => { looiFace.classList.remove('is-talking'); ocupada = false; };
    window.speechSynthesis.speak(f);
}
