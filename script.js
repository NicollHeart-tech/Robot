const video     = document.getElementById('video');
const canvas    = document.getElementById('canvas');
const ctx       = canvas.getContext('2d');
const looiFace  = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');
const input     = document.getElementById('inputTexto');

// ⚠️ COLOQUE AQUI O SEU LINK DO LOCALTUNNEL (ex: https://xxx.loca.lt)
const URL_TUNEL = "https://looi-robot.loca.lt";

// Header obrigatório para o LocalTunnel não bloquear as requisições
const HEADERS_TUNNEL = { 'bypass-tunnel-reminder': 'true' };

// ── LOGIN ────────────────────────────────────────────────
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

// ── INICIALIZAÇÃO ────────────────────────────────────────
function iniciarSistemas() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(s => { video.srcObject = s; })
        .catch(err => console.warn("Câmera não disponível:", err));
    window.speechSynthesis.getVoices();
    setTimeout(() => roboFalar("Acesso concedido. Olá, eu sou a LOOI."), 500);
}

// ── SÍNTESE DE VOZ ───────────────────────────────────────
function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    const vozes = window.speechSynthesis.getVoices();
    fala.voice = vozes.find(v => v.lang.startsWith('pt') && v.name.toLowerCase().includes('google'))
              || vozes.find(v => v.lang.startsWith('pt'))
              || vozes[0];
    fala.pitch = 1.2;
    fala.rate  = 1.0;
    fala.onstart = () => looiMouth.classList.add('is-talking');
    fala.onend   = () => looiMouth.classList.remove('is-talking');
    window.speechSynthesis.speak(fala);
}

// ── CÂMERA ───────────────────────────────────────────────
function capturarFrame() {
    return new Promise((resolve) => {
        if (video.videoWidth > 0) {
            canvas.width  = 320;
            canvas.height = 240;
            ctx.drawImage(video, 0, 0, 320, 240);
            canvas.toBlob(resolve, 'image/jpeg');
        } else {
            resolve(null);
        }
    });
}

// ── EXPRESSÕES ───────────────────────────────────────────
function aplicarEmocao(emocao) {
    const e = (emocao || 'neutro').toLowerCase();
    looiFace.className = 'face ' + e;
}

// ── COMUNICAÇÃO COM A IA ─────────────────────────────────
async function comunicar(texto) {
    if (!texto || !texto.trim()) return;

    const blob = await capturarFrame();
    const fd = new FormData();
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

// ── MICROFONE ────────────────────────────────────────────
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
const btnVoz = document.getElementById('btnVoz');

if (Reconhecimento) {
    const ouvinte = new Reconhecimento();
    ouvinte.lang = 'pt-BR';
    ouvinte.continuous     = false;
    ouvinte.interimResults = false;

    ouvinte.onresult = (e) => {
        const transcricao = e.results[0][0].transcript;
        console.log("Ouvi:", transcricao);
        input.value = transcricao;
        comunicar(transcricao);
    };

    ouvinte.onstart = () => { btnVoz.textContent = '🔴'; };
    ouvinte.onend   = () => { btnVoz.textContent = '🎤'; };
    ouvinte.onerror = (e) => {
        console.error("Erro microfone:", e.error);
        btnVoz.textContent = '🎤';
        if (e.error === 'not-allowed') {
            alert("Permissão de microfone negada.\nClique no cadeado do navegador e permita o microfone.");
        }
    };

    btnVoz.onclick = () => {
        try { ouvinte.start(); } catch(e) { console.warn(e); }
    };
} else {
    btnVoz.disabled = true;
    btnVoz.title = "Use o Chrome para reconhecimento de voz.";
}

// ── ENVIAR TEXTO ─────────────────────────────────────────
document.getElementById('btnEnviar').onclick = () => {
    comunicar(input.value);
    input.value = "";
};
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { comunicar(input.value); input.value = ""; }
});

// ── FULLSCREEN ───────────────────────────────────────────
document.getElementById('btnFullscreen').onclick = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
        document.exitFullscreen();
    }
};

// ── ANÁLISE PERIÓDICA DA CÂMERA (a cada 10s) ─────────────
setInterval(async () => {
    const blob = await capturarFrame();
    if (!blob) return;

    const fd = new FormData();
    fd.append('texto', 'Descreva brevemente o que está vendo.');
    fd.append('imagem', blob, 'visao.jpg');

    try {
        const r = await fetch(`${URL_TUNEL}/interagir`, {
            method: 'POST',
            headers: HEADERS_TUNNEL,
            body: fd
        });
        const dados = await r.json();
        if (dados.emocao && dados.emocao !== "NEUTRO") {
            aplicarEmocao(dados.emocao);
        }
    } catch (_) {}
}, 10000);
