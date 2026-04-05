let URL_SERV = localStorage.getItem('looi_url') || "https://looi-robot.loca.lt";
let ocupada = false;

function verificarSenha() {
    if (document.getElementById('senhaInput').value === "233442") {
        document.getElementById('tela-login').style.display = "none";
        document.getElementById('conteudo-robo').style.display = "flex";
        iniciarCam();
    }
}

function iniciarCam() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => {
        document.getElementById('video').srcObject = s;
    });
    roboFalar("Sistemas de nuvem ativos. Olá, Nicollas!");
}

// FUNÇÃO DE TELA CHEIA (ATIVAR/DESATIVAR)
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// --- SISTEMA DE VOZ ---
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const ouvinte = Rec ? new Rec() : null;

if (ouvinte) {
    ouvinte.lang = 'pt-BR';
    // Quando você começa a falar, a LOOI brilha mais forte (feedback visual)
    ouvinte.onstart = () => { document.body.style.boxShadow = "inset 0 0 50px #00f7ff"; };
    ouvinte.onend = () => { document.body.style.boxShadow = "none"; };
    
    ouvinte.onresult = (e) => {
        const transcricao = e.results[0][0].transcript;
        comunicar(transcricao);
    };
}

function ativarVoz() {
    // Só funciona se suportado, não estiver ocupada e tiver permissão
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
    inputTexto.value = "";
    
    const canv = document.getElementById('canvas');
    const vid = document.getElementById('video');
    canv.width = 400; canv.height = 300;
    canv.getContext('2d').drawImage(vid, 0, 0, 400, 300);

    canv.toBlob(blob => {
        const fd = new FormData();
        fd.append('texto', texto);
        fd.append('imagem', blob);

        // Comunica com o cérebro cloud
        fetch(`${URL_SERV}/interagir`, {
            method: 'POST',
            body: fd,
            headers: { "Bypass-Tunnel-Reminder": "true" } // Pula a página de aviso do LocalTunnel
        })
        .then(r => r.json())
        .then(dados => {
            document.getElementById('looi-face').className = 'face ' + dados.emocao.toLowerCase();
            roboFalar(dados.resposta);
        });
    }, 'image/jpeg');
}

// Botões normais
document.getElementById('btnEnviar').onclick = () => {
    const val = document.getElementById('inputTexto').value;
    comunicar(val);
    document.getElementById('inputTexto').value = "";
};

// Menu e Config
function toggleMenu() {
    const m = document.getElementById('menu-config');
    m.style.display = m.style.display === "block" ? "none" : "block";
}
function salvarConfig() {
    URL_SERV = document.getElementById('configUrl').value;
    localStorage.setItem('looi_url', URL_SERV);
    toggleMenu();
}
