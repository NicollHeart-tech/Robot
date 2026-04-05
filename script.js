const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const looiFace = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');
const input = document.getElementById('inputTexto');

// COLOQUE AQUI O SEU LINK DO CLOUDFLARE/PINGGY
const URL_TUNEL = "https://looi-robot.loca.lt";

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

function iniciarSistemas() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(s => { video.srcObject = s; })
        .catch(err => console.warn("Câmera não disponível:", err));
    roboFalar("Acesso concedido. Olá, eu sou a LOOI.");
}

function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    // Aguarda vozes carregarem antes de escolher
    const vozes = window.speechSynthesis.getVoices();
    const vozPT = vozes.find(v => v.lang.startsWith('pt') && v.name.toLowerCase().includes('google'))
                || vozes.find(v => v.lang.startsWith('pt'))
                || vozes[0];
    if (vozPT) fala.voice = vozPT;
    fala.pitch = 1.2;
    fala.onstart = () => looiMouth.classList.add('is-talking');
    fala.onend   = () => looiMouth.classList.remove('is-talking');
    window.speechSynthesis.speak(fala);
}

// Captura frame atual da câmera e retorna uma Promise<Blob>
function capturarFrame() {
    return new Promise((resolve) => {
        if (video.videoWidth > 0) {
            canvas.width  = 320;
            canvas.height = 240;
            ctx.drawImage(video, 0, 0, 320, 240);
            canvas.toBlob(resolve, 'image/jpeg');
        } else {
            resolve(null); // sem câmera, manda só texto
        }
    });
}

// FIX PRINCIPAL: usa FormData (igual ao que o Flask espera) e inclui a imagem
async function comunicar(texto) {
    if (!texto || !texto.trim()) return;

    const blob = await capturarFrame();
    const fd = new FormData();
    fd.append('texto', texto);
    if (blob) fd.append('imagem', blob, 'visao.jpg');

    try {
        const r = await fetch(`${URL_TUNEL}/interagir`, { method: 'POST', body: fd });
        const dados = await r.json();
        looiFace.className = 'face ' + (dados.emocao || 'neutro').toLowerCase();
        roboFalar(dados.resposta);
    } catch (err) {
        console.error("Erro ao comunicar:", err);
        roboFalar("Não consegui falar com meu cérebro.");
    }
}

// MICROFONE — precisa de HTTPS em produção; localhost funciona sem
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;

if (Reconhecimento) {
    const ouvinte = new Reconhecimento();
    ouvinte.lang = 'pt-BR';
    ouvinte.continuous = false;
    ouvinte.interimResults = false;

    ouvinte.onresult = (e) => {
        const transcricao = e.results[0][0].transcript;
        console.log("Ouvi:", transcricao);
        input.value = transcricao;
        comunicar(transcricao);
    };

    ouvinte.onerror = (e) => {
        console.error("Erro no microfone:", e.error);
        if (e.error === 'not-allowed') {
            alert("Permissão de microfone negada. Clique no cadeado do navegador e permita o microfone.");
        }
    };

    document.getElementById('btnVoz').onclick = () => {
        ouvinte.start();
        document.getElementById('btnVoz').textContent = '🔴';
        ouvinte.onend = () => { document.getElementById('btnVoz').textContent = '🎤'; };
    };
} else {
    document.getElementById('btnVoz').disabled = true;
    document.getElementById('btnVoz').title = "Seu navegador não suporta reconhecimento de voz";
    console.warn("SpeechRecognition não suportado neste navegador.");
}

document.getElementById('btnEnviar').onclick = () => {
    comunicar(input.value);
    input.value = "";
};

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        comunicar(input.value);
        input.value = "";
    }
});

// Análise periódica da câmera — usa /interagir com mensagem automática
// (removido /pensar que não existe no backend)
setInterval(async () => {
    const blob = await capturarFrame();
    if (!blob) return;

    const fd = new FormData();
    fd.append('texto', 'Descreva brevemente o que está vendo.');
    fd.append('imagem', blob, 'visao.jpg');

    try {
        const r = await fetch(`${URL_TUNEL}/interagir`, { method: 'POST', body: fd });
        const dados = await r.json();
        // Só atualiza emoção, não fala (para não interromper conversa)
        if (dados.emocao && dados.emocao !== "NEUTRO") {
            looiFace.className = 'face ' + dados.emocao.toLowerCase();
        }
    } catch (_) {}
}, 10000);
