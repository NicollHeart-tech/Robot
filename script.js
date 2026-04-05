let URL_SERVIDOR = localStorage.getItem('looi_url') || "https://looi-robot.loca.lt";
let ocupada = false;

function verificarSenha() {
    if (document.getElementById('senhaInput').value === "233442") {
        document.getElementById('tela-login').style.display = "none";
        document.getElementById('conteudo-robo').style.display = "flex";
        iniciarHardware();
    }
}

function iniciarHardware() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => {
        document.getElementById('video').srcObject = s;
    });
    roboFalar("Sistemas online. Estou te ouvindo.");
}

function toggleFullScreen() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); }
    else { document.exitFullscreen(); }
}

// --- SISTEMA DE VOZ MELHORADO ---
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
const ouvinte = Reconhecimento ? new Reconhecimento() : null;

if (ouvinte) {
    ouvinte.lang = 'pt-BR';
    ouvinte.onstart = () => { document.body.style.border = "2px solid #00f7ff"; };
    ouvinte.onend = () => { document.body.style.border = "none"; };
    ouvinte.onresult = (e) => {
        const texto = e.results[0][0].transcript;
        comunicar(texto);
    };
}

function ativarVoz() {
    if (ouvinte && !ocupada) ouvinte.start();
}

function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.onstart = () => {
        ocupada = true;
        document.getElementById('looi-face').classList.add('is-talking');
    };
    fala.onend = () => {
        document.getElementById('looi-face').classList.remove('is-talking');
        ocupada = false;
    };
    window.speechSynthesis.speak(fala);
}

function comunicar(texto) {
    if (!texto || ocupada) return;
    const canvas = document.getElementById('canvas');
    const video = document.getElementById('video');
    canvas.width = 400; canvas.height = 300;
    canvas.getContext('2d').drawImage(video, 0, 0, 400, 300);

    canvas.toBlob(blob => {
        const fd = new FormData();
        fd.append('texto', texto);
        fd.append('imagem', blob);

        fetch(`${URL_SERVIDOR}/interagir`, {
            method: 'POST',
            body: fd,
            headers: { "Bypass-Tunnel-Reminder": "true" }
        })
        .then(r => r.json())
        .then(dados => {
            document.getElementById('looi-face').className = 'face ' + dados.emocao.toLowerCase();
            roboFalar(dados.resposta);
        });
    }, 'image/jpeg');
}

document.getElementById('btnEnviar').onclick = () => {
    comunicar(document.getElementById('inputTexto').value);
    document.getElementById('inputTexto').value = "";
};

function toggleMenu() {
    const m = document.getElementById('menu-config');
    m.style.display = m.style.display === "block" ? "none" : "block";
}
function salvarConfig() {
    URL_SERVIDOR = document.getElementById('configUrl').value;
    localStorage.setItem('looi_url', URL_SERVIDOR);
    toggleMenu();
}
