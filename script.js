const videoEl   = document.getElementById('video');
const canvas    = document.getElementById('canvas');
const ctx       = canvas.getContext('2d');
const looiFace  = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');
const input     = document.getElementById('inputTexto');

// ⚠️ COLOQUE AQUI O SEU LINK DO LOCALTUNNEL (ex: https://xxx.loca.lt)
const URL_TUNEL = "https://looi-robot.loca.lt";

const HEADERS_TUNNEL = { 'bypass-tunnel-reminder': 'true' };

// ── LOGIN ─────────────────────────────────────────────────
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

// ── INICIALIZAÇÃO ─────────────────────────────────────────
function iniciarSistemas() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
        .then(stream => { videoEl.srcObject = stream; })
        .catch(err => console.warn("Câmera não disponível:", err));

    window.speechSynthesis.getVoices();
    setTimeout(() => {
        ligarMicrofone();
        roboFalar("Acesso concedido. Olá, eu sou a LOOI.");
    }, 600);

    agendarPiscar(); // inicia animação de piscar
}

// ── SÍNTESE DE VOZ ────────────────────────────────────────
function roboFalar(texto) {
    window.speechSynthesis.cancel();
    pararOuvinte();

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    const vozes = window.speechSynthesis.getVoices();
    fala.voice = vozes.find(v => v.lang.startsWith('pt') && v.name.toLowerCase().includes('google'))
              || vozes.find(v => v.lang.startsWith('pt'))
              || vozes[0];
    fala.pitch = 1.2;
    fala.rate  = 1.0;
    fala.onstart = () => looiMouth.classList.add('is-talking');
    fala.onend   = () => {
        looiMouth.classList.remove('is-talking');
        setTimeout(iniciarOuvinte, 600);
    };
    window.speechSynthesis.speak(fala);
}

// ── CÂMERA — captura um frame para conversas ──────────────
function capturarFrame() {
    return new Promise((resolve) => {
        if (videoEl.videoWidth > 0) {
            canvas.width  = 854;
            canvas.height = 480;
            ctx.drawImage(videoEl, 0, 0, 320, 240);
            canvas.toBlob(resolve, 'image/jpeg');
        } else {
            resolve(null);
        }
    });
}

// ── FOTO A CADA 2.5 SEGUNDOS ─────────────────────────────
let analisandoFoto = false; // evita acumular chamadas simultâneas

async function analisarFoto() {
    if (analisandoFoto) return; // descarta se a anterior ainda não terminou
    analisandoFoto = true;

    const blob = await capturarFrame();
    if (!blob) { analisandoFoto = false; return; }

    const fd = new FormData();
    fd.append('texto', 'Descreva brevemente o que está vendo.');
    fd.append('imagem', blob, 'visao.jpg');

    try {
        const r = await fetch(`${URL_TUNEL}/interagir`, {
            method: 'POST',
            headers: HEADERS_TUNNEL,
            body: fd
        });
        if (r.ok) {
            const dados = await r.json();
            if (dados.emocao && dados.emocao !== 'NEUTRO') {
                aplicarEmocao(dados.emocao);
            }
        }
    } catch (_) {}

    analisandoFoto = false;
}

setInterval(analisarFoto, 2500);

// ── EXPRESSÕES ────────────────────────────────────────────
function aplicarEmocao(emocao) {
    const e = (emocao || 'neutro').toLowerCase();
    looiFace.className = 'face ' + e;
}

// ── ANIMAÇÃO: PISCAR ──────────────────────────────────────
function piscar() {
    // Não pisca enquanto está com emoção forte (bravo/surpreso)
    if (looiFace.classList.contains('bravo') || looiFace.classList.contains('surpreso')) return;

    const olhos = looiFace.querySelectorAll('.eye');
    olhos.forEach(o => o.style.transform = 'scaleY(0.06)');
    setTimeout(() => {
        olhos.forEach(o => o.style.transform = '');
    }, 130);
}

function agendarPiscar() {
    // Intervalo aleatório entre 2.5s e 6s — mais natural
    const delay = 2500 + Math.random() * 3500;
    setTimeout(() => {
        piscar();
        // Às vezes pisca duas vezes seguidas
        if (Math.random() < 0.25) {
            setTimeout(piscar, 280);
        }
        agendarPiscar();
    }, delay);
}

// ── COMUNICAÇÃO COM A IA (conversa) ───────────────────────
async function comunicar(texto) {
    if (!texto || !texto.trim()) return;

    const blob = await capturarFrame();
    const fd   = new FormData();
    fd.append('texto', texto);
    if (blob) fd.append('imagem', blob, 'visao.jpg');

    try {
        const r = await fetch(`${URL_TUNEL}/interagir`, {
            method: 'POST',
            headers: HEADERS_TUNNEL,
            body: fd
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const dados = await r.json();
        aplicarEmocao(dados.emocao);
        roboFalar(dados.resposta);
    } catch (err) {
        console.error("Erro ao comunicar:", err);
        aplicarEmocao('triste');
        roboFalar("Não consegui falar com meu cérebro.");
    }
}

// ── MICROFONE SEMPRE ATIVO ────────────────────────────────
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
const btnVoz = document.getElementById('btnVoz');

let micAtivo   = false;
let micRodando = false;
let ouvinte    = null;

function iniciarOuvinte() {
    if (!micAtivo || micRodando || !ouvinte) return;
    try { ouvinte.start(); } catch(e) {}
}

function pararOuvinte() {
    if (!ouvinte) return;
    try { ouvinte.stop(); } catch(e) {}
}

function ligarMicrofone() {
    micAtivo = true;
    btnVoz.textContent = '🔴';
    btnVoz.title = 'Microfone ligado — clique para desligar';
    iniciarOuvinte();
}

function desligarMicrofone() {
    micAtivo = false;
    btnVoz.textContent = '🎤';
    btnVoz.title = 'Microfone desligado — clique para ligar';
    pararOuvinte();
}

if (Reconhecimento) {
    ouvinte = new Reconhecimento();
    ouvinte.lang           = 'pt-BR';
    ouvinte.continuous     = true;
    ouvinte.interimResults = false;

    ouvinte.onstart = () => { micRodando = true; };

    ouvinte.onresult = (e) => {
        const resultado = e.results[e.results.length - 1];
        if (!resultado.isFinal) return;
        const transcricao = resultado[0].transcript.trim();
        if (!transcricao) return;
        console.log("Ouvi:", transcricao);
        input.value = transcricao;
        comunicar(transcricao);
        setTimeout(() => { input.value = ""; }, 1500); // mostra 1.5s e limpa
    };

    ouvinte.onend = () => {
        micRodando = false;
        if (micAtivo) setTimeout(iniciarOuvinte, 300);
    };

    ouvinte.onerror = (e) => {
        micRodando = false;
        if (e.error === 'not-allowed') {
            micAtivo = false;
            btnVoz.textContent = '🎤';
            alert("Permissão de microfone negada.\nClique no cadeado e permita o microfone.");
        }
        if (micAtivo && e.error !== 'not-allowed') {
            setTimeout(iniciarOuvinte, 1000);
        }
    };

    btnVoz.onclick = () => {
        if (micAtivo) desligarMicrofone();
        else          ligarMicrofone();
    };
} else {
    btnVoz.disabled = true;
    btnVoz.title = "Use o Chrome para reconhecimento de voz.";
}

// ── ENVIAR TEXTO ──────────────────────────────────────────
document.getElementById('btnEnviar').onclick = () => {
    comunicar(input.value); input.value = "";
};
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { comunicar(input.value); input.value = ""; }
});

// ── FULLSCREEN ────────────────────────────────────────────
document.getElementById('btnFullscreen').onclick = () => {
    if (!document.fullscreenElement)
        document.documentElement.requestFullscreen().catch(() => {});
    else
        document.exitFullscreen();
};
