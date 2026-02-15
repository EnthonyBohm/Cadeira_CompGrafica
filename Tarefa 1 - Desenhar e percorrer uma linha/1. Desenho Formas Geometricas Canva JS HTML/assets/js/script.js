function main () {
    let canvas = document.getElementById("tutorial");
    let ctx = canvas.getContext("2d");

    function drawRectangle () {
        
        // ctx.fillStyle = "rgb(200,0,0)";
        // ctx.fillRect (10, 10, 55, 50);
    
        // ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
        // ctx.fillRect(30, 30, 55, 50);
    
        // Desenha um retângulo preenchido
        ctx.fillRect (25, 25, 100, 100);
        // Limpa o preenchimento de um retângulo
        ctx.clearRect (45, 45, 60, 60);
        // Desenha somente as bordas de um retângulo
        ctx.strokeRect (50, 50, 50, 50);
    }

    function drawPathTriangle () {

    // Desenha Triângulo preenchido
        ctx.beginPath();
        ctx.moveTo(25, 25);
        ctx.lineTo(105,25);
        ctx.lineTo(25,105);
        ctx.fill();

    // Desenha Triângulo delineado
        ctx.beginPath();
        ctx.moveTo(125, 125);
        ctx.lineTo(125,45);
        ctx.lineTo(45,125);
        ctx.closePath();
        ctx.stroke();
    }

    function drawPathArc () {
        for (let i = 0; i < 4; i++) {
            for (let j=0; j<3; j++) {
                ctx.beginPath();
                let x = 25 + j * 50;    // Coordenada x
                var y = 25 + i * 50;    // Coordenada y
                var radius = 20;        // Raio do arco
                var startAngle = 0;     // Ponto incial do circulo
                var endAngle = Math.PI + (Math.PI * j) / 2;     // Ponto Final no circulo
                var anticlockwise = i % 2 == 0 ? false : true   

                ctx.arc(x,y, radius, startAngle, endAngle, anticlockwise);

                if ( i>1 ) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
            }
        }
    }


    function drawBezierQuadratics() {

        ctx.beginPath();
        ctx.moveTo(75,25);
        ctx.quadraticCurveTo(25, 25, 25, 62.5);
        ctx.quadraticCurveTo(25, 100, 50, 100);
        ctx.quadraticCurveTo(50, 120, 30, 125);
        ctx.quadraticCurveTo(60, 120, 65, 100);
        ctx.quadraticCurveTo(125, 100, 125, 62.5);
        ctx.quadraticCurveTo(125, 25, 75, 25);
        ctx.stroke();
    }

}

main();