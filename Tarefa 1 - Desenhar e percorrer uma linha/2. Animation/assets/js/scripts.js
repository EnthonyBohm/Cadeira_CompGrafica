const canvas = document.getElementById('meuCanvas');
const ctx = canvas.getContext('2d');

let bolinha = {
    x:10,
    y:100,
    raio: 15,
    velocidade: 2
};

function animar() {
    ctx.clearRect (0, 0, canvas.width, canvas.height);

    bolinha.x += bolinha.velocidade;

    if (bolinha.x > canvas.width){
        bolinha.x = 10;
    }

    ctx.beginPath();
    ctx.arc(bolinha.x, bolinha.y, bolinha.raio, 0, Math.PI*2);
    ctx.fillStyle = "rgb(200, 0, 0)";
    ctx.fill();

    requestAnimationFrame(animar);
}

animar();