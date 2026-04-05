const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const looiFace = document.getElementById('looi-face');
const looiMouth = document.getElementById('looi-mouth');
const input = document.getElementById('inputTexto');

// COLOQUE AQUI O SEU LINK DO CLOUDFLARE/PINGGY
const URL_TUNEL = "https://looi-robot.loca.lt"; 

// Função que confere a senha para liberar o sistema
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

// Liga a câmera do usuário e dá as boas-vindas
function iniciarSistemas() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(s => video.srcObject = s);
    roboFalar("Acesso concedido. Olá, eu sou a LOOI.");
}

// Faz o navegador falar o texto e anima a boca da LOOI
function roboFalar(texto) {
    window.speechSynthesis.cancel();
    const f = new SpeechSynthesisUtterance(texto);
    f.lang = 'pt-BR';
    const vozes = window.speechSynthesis.getVoices();
    f.voice = vozes.find(v => v.name.includes('Google')) || vozes[0];
    f.pitch = 1.2;
    f.onstart = () => looiMouth.classList.add('is-talking');
    f.onend = () => looiMouth.classList.remove('is-talking');
    window.speechSynthesis.speak(f);
}

// Envia o que você digitou ou falou para o Python (Cérebro)
function comunicar(texto) {
    fetch(`${URL_TUNEL}/interagir`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({texto: texto})
    })
    .then(r => r.json())
    .then(dados => {
        // Muda a cara da LOOI baseado na emoção que a IA sentiu
        looiFace.className = 'face ' + dados.emocao.toLowerCase();
        roboFalar(dados.resposta);
    });
}

// Configuração do microfone (Reconhecimento de Voz)
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
const ouvinte = new Reconhecimento();
ouvinte.lang = 'pt-BR';
ouvinte.onresult = (e) => comunicar(e.results[0][0].transcript);

// Botões da interface
document.getElementById('btnEnviar').onclick = () => { comunicar(input.value); input.value = ""; };
document.getElementById('btnVoz').onclick = () => ouvinte.start();

// --- SISTEMA DE VISÃO DA LOOI (Onde a mágica acontece) ---
setInterval(() => {
    if (video.videoWidth > 0) {
        // 1. Definimos o tamanho da foto para 480p (640 de largura por 480 de altura)
        canvas.width = 640; 
        canvas.height = 480;
        
        // 2. Tiramos o "print" do vídeo e colamos no Canvas
        ctx.drawImage(video, 0, 0, 640, 480);
        
        // 3. Transformamos o desenho em um arquivo de imagem (JPEG)
        canvas.toBlob(blob => {
            const fd = new FormData(); 
            fd.append('imagem', blob);
            
            // 4. Enviamos para a IA analisar a imagem
            fetch(`${URL_TUNEL}/pensar`, { method: 'POST', body: fd })
            .then(r => r.text())
            .then(emocao => { 
                // Se a IA detectar uma emoção só de olhar, a LOOI muda de expressão
                if(emocao !== "NEUTRO") {
                    looiFace.className = 'face ' + emocao.toLowerCase();
                }
            });
        }, 'image/jpeg', 0.7); // 0.7 economiza um pouco de internet sem perder qualidade
    }
}, 1500); // 1500 milissegundos = 1.5 segundo
