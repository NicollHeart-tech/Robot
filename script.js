// VARIÁVEIS DE ESTADO
let URL_SERVIDOR = localStorage.getItem('looi_url') || "https://looi-robot.loca.lt";
let ocupada = false;
let moodAtual = "NEUTRAL";

const looiFace = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');
const input = document.getElementById('inputTexto');

// 1. LOGIN E HARDWARE
function verificarSenha() {
    if (document.getElementById('senhaInput').value === "233442") {
        document.getElementById('tela-login').style.fadeOut = "slow";
        document.getElementById('tela-login').style.display = "none";
        document.getElementById('conteudo-robo').style.display = "flex";
        iniciarHardware();
    }
}

function iniciarHardware() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(s => document.getElementById('video').srcObject = s);
    roboFalar("Protocolos LOOI v3 ativados. Como posso ajudar hoje?");
    updateHUD();
}

// 2. SISTEMA DE FALA
function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.pitch = 1.4;
    fala.rate = 1.1;

    fala.onstart = () => {
        ocupada = true;
        looiMouth.classList.add('is-talking');
    };
    fala.onend = () => {
        looiMouth.classList.remove('is-talking');
        ocupada = false;
        setTimeout(() => setMood("NEUTRAL"), 2000);
    };
    window.speechSynthesis.speak(fala);
}

// 3. INTERAÇÃO (CHAT E VISÃO)
function comunicar(texto) {
    if (!texto || ocupada) return;
    setMood("THINKING");

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
            setMood(dados.emocao);
            roboFalar(dados.resposta);
        })
        .catch(() => {
            setMood("SAD");
            roboFalar("Falha crítica de conexão.");
        });
    }, 'image/jpeg');
}

// 4. FUNÇÕES DE STATUS E HUD
function setMood(mood) {
    looiFace.className = 'face ' + mood.toLowerCase();
    document.getElementById('status-mood').innerText = mood.toUpperCase();
}

function updateHUD() {
    setInterval(() => {
        document.getElementById('cpu-bar').style.width = Math.floor(Math.random() * 40 + 20) + "%";
        document.getElementById('mem-bar').style.width = Math.floor(Math.random() * 30 + 50) + "%";
    }, 2000);
}

// 5. INTERAÇÃO FÍSICA (CARINHO)
document.getElementById('pet-area').onclick = () => {
    setMood("FELIZ");
    const reacoes = ["Isso é bom!", "Hehe!", "Eu gosto de carinho.", "Processamento otimizado!"];
    roboFalar(reacoes[Math.floor(Math.random() * reacoes.length)]);
};

// 6. CONFIGURAÇÕES
function toggleMenu() {
    const m = document.getElementById('menu-config');
    m.style.display = m.style.display === "block" ? "none" : "block";
}
function salvarConfig() {
    const novaUrl = document.getElementById('configUrl').value;
    if(novaUrl) {
        URL_SERVIDOR = novaUrl;
        localStorage.setItem('looi_url', novaUrl);
        alert("Link atualizado com sucesso!");
        toggleMenu();
    }
}

// EVENTOS
document.getElementById('btnEnviar').onclick = () => { comunicar(input.value); input.value = ""; };
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
if(Reconhecimento) {
    const ouvinte = new Reconhecimento();
    ouvinte.lang = 'pt-BR';
    ouvinte.onresult = (e) => comunicar(e.results[0][0].transcript);
    document.getElementById('btnVoz').onclick = () => ouvinte.start();
}
