// CONFIGURAÇÕES INICIAIS
let URL_SERVIDOR = localStorage.getItem('looi_url') || "https://looi-robot.loca.lt";
let ocupada = false;

const looiFace = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');
const input = document.getElementById('inputTexto');

// 1. SISTEMA DE LOGIN
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
        .then(s => document.getElementById('video').srcObject = s);
    roboFalar("Protocolos Ultra ativados. Todos os sistemas estão online.");
    iniciarHUD();
}

// 2. FUNÇÃO DE TELA CHEIA
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// 3. RECONHECIMENTO DE VOZ (CORRIGIDO)
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Reconhecimento) {
    const ouvinte = new Reconhecimento();
    ouvinte.lang = 'pt-BR';
    
    ouvinte.onstart = () => { document.getElementById('btnVoz').style.color = "red"; };
    ouvinte.onend = () => { document.getElementById('btnVoz').style.color = "#00f7ff"; };
    
    ouvinte.onresult = (e) => {
        const resultado = e.results[0][0].transcript;
        comunicar(resultado);
    };

    document.getElementById('btnVoz').onclick = () => ouvinte.start();
}

// 4. FALA E EMOÇÃO
function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.pitch = 1.3;
    fala.onstart = () => { ocupada = true; looiMouth.classList.add('is-talking'); };
    fala.onend = () => { looiMouth.classList.remove('is-talking'); ocupada = false; };
    window.speechSynthesis.speak(fala);
}

// 5. COMUNICAÇÃO (ENVIAR PARA O PC)
function comunicar(texto) {
    if (!texto || ocupada) return;
    input.value = "";
    
    // Tira foto
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
            looiFace.className = 'face ' + dados.emocao.toLowerCase();
            roboFalar(dados.resposta);
        })
        .catch(() => roboFalar("Erro de conexão. Verifique o servidor."));
    }, 'image/jpeg');
}

// 6. HUD E CARINHO
function iniciarHUD() {
    setInterval(() => {
        document.getElementById('cpu-bar').style.width = (Math.random() * 50 + 20) + "%";
        document.getElementById('mem-bar').style.width = (Math.random() * 30 + 40) + "%";
    }, 2000);
}

document.getElementById('pet-area').onclick = () => {
    looiFace.className = "face feliz";
    roboFalar("Isso é muito bom, obrigada pelo carinho!");
};

// 7. MENU CONFIG
function toggleMenu() {
    const m = document.getElementById('menu-config');
    m.style.display = m.style.display === "block" ? "none" : "block";
}
function salvarConfig() {
    const novaUrl = document.getElementById('configUrl').value;
    if(novaUrl) {
        URL_SERVIDOR = novaUrl;
        localStorage.setItem('looi_url', novaUrl);
        toggleMenu();
        alert("Link Atualizado!");
    }
}

document.getElementById('btnEnviar').onclick = () => comunicar(input.value);
