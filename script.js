const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const looiFace = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');
const input = document.getElementById('inputTexto');

// IMPORTANTE: Substitui pelo teu link atual do LocalTunnel
const URL_SERVIDOR_PC = "https://looi-robot.loca.lt"; 

// 1. SISTEMA DE SEGURANÇA
function verificarSenha() {
    const senha = document.getElementById('senhaInput').value;
    if (senha === "233442") {
        document.getElementById('tela-login').style.display = "none";
        document.getElementById('conteudo-robo').style.display = "flex";
        iniciarHardware();
    } else {
        document.getElementById('erroMsg').style.display = "block";
        document.getElementById('senhaInput').value = "";
    }
}

// 2. INICIAR CÂMARA E VOZ
function iniciarHardware() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(s => video.srcObject = s)
        .catch(e => console.error("Erro na câmara:", e));
    
    roboFalar("Acesso confirmado. Olá, eu sou a LOOI.");
}

// 3. FUNÇÃO DE FALA (VOZ DE IA)
function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    
    const vozes = window.speechSynthesis.getVoices();
    const melhorVoz = vozes.find(v => v.name.includes('Google')) || vozes[0];
    fala.voice = melhorVoz;
    fala.pitch = 1.3;

    // Anima a boca enquanto fala
    fala.onstart = () => looiMouth.classList.add('is-talking');
    fala.onend = () => looiMouth.classList.remove('is-talking');

    window.speechSynthesis.speak(fala);
}

// 4. COMUNICAÇÃO (O QUE CORRIGIU O ERRO DE TEXTO)
function comunicar(texto) {
    if (!texto) return;

    console.log("A enviar texto para o Python: " + texto);
    looiFace.className = 'face confuso'; // Mostra que está a pensar

    fetch(`${URL_SERVIDOR_PC}/interagir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "texto": texto }) // Garante o formato correto
    })
    .then(r => r.json())
    .then(dados => {
        // Muda o rosto para a emoção que a IA escolheu
        looiFace.className = 'face ' + dados.emocao.toLowerCase();
        roboFalar(dados.resposta);
    })
    .catch(err => {
        console.error("Erro no túnel:", err);
        roboFalar("Não consegui conectar ao meu cérebro remoto.");
    });
}

// 5. EVENTOS DOS BOTÕES
document.getElementById('btnEnviar').onclick = () => {
    if (input.value) {
        comunicar(input.value);
        input.value = "";
    }
};

const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Reconhecimento) {
    const ouvinte = new Reconhecimento();
    ouvinte.lang = 'pt-BR';
    ouvinte.onresult = (e) => comunicar(e.results[0][0].transcript);
    document.getElementById('btnVoz').onclick = () => ouvinte.start();
}

// 6. CICLO DE VISÃO (7 segundos)
setInterval(() => {
    if (video.videoWidth > 0 && document.getElementById('tela-login').style.display === "none") {
        canvas.width = 320; canvas.height = 240;
        ctx.drawImage(video, 0, 0, 320, 240);
        canvas.toBlob(blob => {
            const fd = new FormData();
            fd.append('imagem', blob);
            fetch(`${URL_SERVIDOR_PC}/pensar`, { method: 'POST', body: fd })
            .then(r => r.text())
            .then(emocao => {
                if (emocao !== "NEUTRO") looiFace.className = 'face ' + emocao.toLowerCase();
            });
        }, 'image/jpeg');
    }
}, 7000);

// Garante que as vozes carreguem
window.speechSynthesis.onvoiceschanged = () => console.log("Vozes carregadas.");
