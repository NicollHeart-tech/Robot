let URL_SERV = localStorage.getItem('looi_url') || "https://looi-robot.loca.lt";
let ocupada = false;
let textoCapturado = "";

function verificarSenha() {
    if (document.getElementById('senhaInput').value === "233442") {
        document.getElementById('tela-login').style.display = "none";
        document.getElementById('conteudo-robo').style.display = "flex";
        iniciarHardware();
    }
}

function iniciarHardware() {
    // Adicionado o playsinline para funcionar vídeo no celular
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true })
        .then(s => { document.getElementById('video').srcObject = s; });
    roboFalar("LOOI iniciada no modo mobile.");
}

function toggleFullScreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

// --- RECONHECIMENTO DE VOZ ---
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const ouvinte = Rec ? new Rec() : null;

if (ouvinte) {
    ouvinte.lang = 'pt-BR';
    ouvinte.onstart = () => { document.body.style.boxShadow = "inset 0 0 50px #00f7ff"; };
    
    ouvinte.onresult = (e) => {
        textoCapturado = e.results[0][0].transcript;
        document.getElementById('inputTexto').value = textoCapturado;
        
        // MOSTRA O BOTÃO DE CONFIRMAR NO MEIO DA TELA
        document.getElementById('container-confirmar').style.display = "block";
    };

    ouvinte.onend = () => { document.body.style.boxShadow = "none"; };
}

function ativarVoz() {
    if (ouvinte && !ocupada) {
        textoCapturado = "";
        ouvinte.start();
    }
}

function confirmarEnvio() {
    if (textoCapturado !== "") {
        comunicar(textoCapturado);
        document.getElementById('container-confirmar').style.display = "none";
        textoCapturado = "";
    }
}

function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const f = new SpeechSynthesisUtterance(texto);
    f.lang = 'pt-BR';
    f.onstart = () => { ocupada = true; document.getElementById('looi-face').classList.add('is-talking'); };
    f.onend = () => { ocupada = false; document.getElementById('looi-face').classList.remove('is-talking'); };
    window.speechSynthesis.speak(f);
}

function comunicar(texto) {
    if (!texto || ocupada) return;
    const canv = document.getElementById('canvas');
    const vid = document.getElementById('video');
    canv.width = 300; canv.height = 225; // Imagem menor para o celular carregar rápido
    canv.getContext('2d').drawImage(vid, 0, 0, 300, 225);

    canv.toBlob(blob => {
        const fd = new FormData();
        fd.append('texto', texto);
        fd.append('imagem', blob);

        fetch(`${URL_SERV}/interagir`, { method: 'POST', body: fd, headers: {"Bypass-Tunnel-Reminder": "true"} })
        .then(r => r.json()).then(d => {
            document.getElementById('looi-face').className = 'face ' + d.emocao.toLowerCase();
            roboFalar(d.resposta);
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
    URL_SERV = document.getElementById('configUrl').value;
    localStorage.setItem('looi_url', URL_SERV);
    toggleMenu();
}
