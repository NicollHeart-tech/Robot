const socket = io("https://looi-robot.loca.lt", {
    extraHeaders: { "Bypass-Tunnel-Reminder": "true" }
});

let ocupada = false;
let ouvindoManual = true; // Controla se o mic deve estar ligado
const looiFace = document.getElementById('looi-face');
const input = document.getElementById('inputTexto');
const video = document.getElementById('video');

// 1. LOGIN
function verificarSenha() {
    if (document.getElementById('senhaInput').value === "233442") {
        document.getElementById('tela-login').style.display = "none";
        document.getElementById('conteudo-robo').style.display = "flex";
        iniciarSistemas();
    }
}

function iniciarSistemas() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true })
        .then(s => {
            video.srcObject = s;
            iniciarVisaoLive();
            iniciarOuvinteContinuo(); // LIGA O MICROFONE SOZINHO
        });
    roboFalar("Sistemas online. Estou ouvindo você, Nicollas.");
}

// 2. VISÃO LIVE VLM
function iniciarVisaoLive() {
    setInterval(() => {
        if (!ocupada && video.videoWidth > 0) {
            const canvas = document.getElementById('canvas');
            canvas.width = 160; canvas.height = 120;
            canvas.getContext('2d').drawImage(video, 0, 0, 160, 120);
            socket.emit('stream_frame', canvas.toDataURL('image/jpeg', 0.5));
        }
    }, 1000);
}

// 3. OUVIDO BIÔNICO (Sempre Ativo)
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const ouvinte = new Rec();
ouvinte.lang = 'pt-BR';
ouvinte.continuous = true; // NÃO PARA DE OUVIR
ouvinte.interimResults = true; // MOSTRA O TEXTO ENQUANTO VOCÊ FALA

ouvinte.onresult = (e) => {
    if (ocupada) return; // Não processa se a IA estiver falando

    let textoFinal = "";
    for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
            textoFinal = e.results[i][0].transcript;
        } else {
            input.value = e.results[i][0].transcript; // Texto aparece na caixinha
        }
    }

    if (textoFinal !== "") {
        input.value = textoFinal;
        socket.emit('chat_live', textoFinal); // Envia automaticamente
    }
};

// Reinicia o mic se o navegador tentar desligar
ouvinte.onend = () => {
    if (!ocupada && ouvindoManual) ouvinte.start();
};

function iniciarOuvinteContinuo() {
    ouvindoManual = true;
    try { ouvinte.start(); } catch(e) {}
}

// 4. RESPOSTA E TRAVA DE VOZ
socket.on('ai_answer', (dados) => {
    looiFace.className = 'face ' + dados.emocao.toLowerCase();
    roboFalar(dados.resposta);
});

function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const f = new SpeechSynthesisUtterance(texto);
    f.lang = 'pt-BR';

    f.onstart = () => {
        ocupada = true; // TRAVA O OUVIDO
        ouvinte.stop(); // DESLIGA O MIC PARA NÃO OUVIR A SI MESMA
        looiFace.classList.add('is-talking');
    };

    f.onend = () => {
        looiFace.classList.remove('is-talking');
        ocupada = false; // LIBERA O OUVIDO
        setTimeout(() => { if(ouvindoManual) ouvinte.start(); }, 500); // VOLTA A OUVIR
    };

    window.speechSynthesis.speak(f);
}

function toggleFullScreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}
