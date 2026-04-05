let URL_SERV = localStorage.getItem('looi_url') || "https://looi-robot.loca.lt";
let ocupada = false;
let textoCapturado = ""; // Armazena o que a IA ouviu

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
    roboFalar("Modo Imersivo ativo. Estou pronta.");
}

function toggleFullScreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

// --- SISTEMA DE VOZ COM CONFIRMAÇÃO ---
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const ouvinte = Rec ? new Rec() : null;

if (ouvinte) {
    ouvinte.lang = 'pt-BR';
    ouvinte.continuous = false; 

    ouvinte.onstart = () => {
        document.body.style.boxShadow = "inset 0 0 60px var(--neon)";
        console.log("Ouvindo...");
    };

    ouvinte.onresult = (e) => {
        textoCapturado = e.results[0][0].transcript;
        document.getElementById('inputTexto').value = textoCapturado; // Mostra o texto na barra
        
        // MOSTRA OS BOTÕES DE CONFIRMAÇÃO
        document.getElementById('btnConfirmar').style.display = "block";
        document.getElementById('confirmar-voz-fs').style.display = "block";
        
        console.log("Detectado: " + textoCapturado);
    };

    ouvinte.onend = () => {
        document.body.style.boxShadow = "none";
    };
}

function ativarVoz() {
    if (ouvinte && !ocupada) {
        textoCapturado = "";
        ouvinte.start();
    }
}

// FUNÇÃO QUE REALMENTE ENVIA PARA O PYTHON
function confirmarEnvio() {
    if (textoCapturado !== "") {
        comunicar(textoCapturado);
        // Esconde os botões após enviar
        document.getElementById('btnConfirmar').style.display = "none";
        document.getElementById('confirmar-voz-fs').style.display = "none";
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
    canv.width = 400; canv.height = 300;
    canv.getContext('2d').drawImage(vid, 0, 0, 400, 300);

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

// Eventos de botões
document.getElementById('btnEnviar').onclick = () => comunicar(document.getElementById('inputTexto').value);

function toggleMenu() {
    const m = document.getElementById('menu-config');
    m.style.display = m.style.display === "block" ? "none" : "block";
}
function salvarConfig() {
    URL_SERV = document.getElementById('configUrl').value;
    localStorage.setItem('looi_url', URL_SERV);
    toggleMenu();
}
