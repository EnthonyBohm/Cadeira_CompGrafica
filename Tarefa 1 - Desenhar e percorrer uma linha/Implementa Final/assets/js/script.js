function main () {
    let canvas = document.getElementById("tutorial");
    let ctx = canvas.getContext("2d");
    const points = [];
    const pontosDaCurva = [];
    
    
    canvas.onmousedown = function(e) {
        if (points.length < 10) {

            point = {
                x : e.clientX - this.offsetLeft,
                y : e.clientY - this.offsetTop,
            }
            points.push(point);
            console.log(points);
        }
        ctx.fillStyle = "rgb(200, 0, 0)";
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius=4, 0, 2*Math.PI);
        ctx.fill();
        
        if (points.length == 10) {
            drawLine();
        }
    }


    
    
    function drawLine () {
        ctx.beginPath();
        let n = 0;
        ctx.moveTo(points[n].x, points[n].y);
        pontosDaCurva.push(points[n]);
        
        for ( ; n < points.length - 1 ; n++){

            for (let t = 0.05; t <= 1; t+= 0.05) {
                let p0 = (n===0) ? points[0] : points[n-1];
                let p1 = points[n];
                let p2 = points[n+1];
                let p3 = (n + 2 > points.length - 1) ? p2 : points[n+2];
                console.log(p3);
                catmullPoints = getCatmullRomPoint (p0, p1, p2, p3, t);
                ctx.lineTo(catmullPoints.x, catmullPoints.y);
                pontosDaCurva.push(catmullPoints);
            }

            // pontosDaCurva.push(points[n]);
        }
        ctx.lineTo(points[n].x, points[n].y);
        ctx.stroke();

        startAnimation();

    }

    function getCatmullRomPoint (p0, p1, p2, p3, t) {

        const qx = 0.5 * ((2 * p1.x) +  (-p0.x + p2.x) * t + (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * t**2 + (-p0.x + 3*p1.x - 3*p2.x + p3.x) * t**3);
        const qy = 0.5 * ((2 * p1.y) +  (-p0.y + p2.y) * t + (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * t**2 + (-p0.y + 3*p1.y - 3*p2.y + p3.y) * t**3);

        return {x:qx, y:qy};
    }

    function distanciaDoisPontos (p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    function calculaMapaDeDistancias () { 
        const distanciasAcumuladas = [0];

        for (let n = 1; n < pontosDaCurva.length; n++) {
            const distanciaAnterior = distanciasAcumuladas[n-1];

            const distanciaSegmento = distanciaDoisPontos (pontosDaCurva[n-1], pontosDaCurva[n])
            distanciasAcumuladas.push (distanciaAnterior + distanciaSegmento);
        }

        return distanciasAcumuladas;
    }


    function startAnimation () {
        const distanciasAcumuladas = calculaMapaDeDistancias();

        // Diferente da implementação feita no teste, essa animação garante um tempo fixo para todos os monitores, 
        // É uma animação baseada em tmepo, por isso utiliza tempoInicial como métrica
        const velocidade = 300;
        let tempoInicial = null;
        const totalLenght = distanciasAcumuladas [distanciasAcumuladas.length-1];
        let animationId;

        ctx.beginPath();
        ctx.arc(pontosDaCurva[0].x, pontosDaCurva[0].y, 6, 0, Math.PI*2);
        ctx.fillStyle = "rgb(0, 200, 0)";
        ctx.fill();

        function loop (timestampAtual) {
            if (tempoInicial == null) {
                tempoInicial = timestampAtual;
            }
            const tempoDecorrido = (timestampAtual - tempoInicial) / 1000;
            let desiredTraveledDistance = velocidade * tempoDecorrido;

            if (desiredTraveledDistance >= totalLenght) {
                const pontoFinal = pontosDaCurva[pontosDaCurva.length - 1];

                beginPath();
                ctx.arc(pontoFinal.x, pontoFinal.y, 6, 0, Math.PI*2);
                ctx.fillStyle = "rgb(0, 200, 0)";
                ctx.fill();

                cancelAnimationFrame(animationId)
                return;
            }

            let i;

            for (i=0; i<distanciasAcumuladas.length-1; i++){
                if (distanciasAcumuladas[i]>desiredTraveledDistance){
                    i--;   
                    break;
                }
            }

            const distanciaTotalSegmento = distanciasAcumuladas[i+1] - distanciasAcumuladas[i];
            const distanciaNoSegmento = desiredTraveledDistance - distanciasAcumuladas[i];
            const porcentagem = distanciaNoSegmento / distanciaTotalSegmento;

            const pontoInicial = pontosDaCurva[i];
            const pontoFinal = pontosDaCurva[i+1];
            const novoX = pontoInicial.x + (pontoFinal.x - pontoInicial.x) * porcentagem;
            const novoY = pontoInicial.y + (pontoFinal.y - pontoInicial.y) * porcentagem;

            ctx.beginPath();
            ctx.arc(novoX, novoY, 6, 0, Math.PI*2);
            ctx.fillStyle = "rgb(0, 200, 0)";
            ctx.fill(); 

            animationId = requestAnimationFrame(loop);
        }
        
        
        requestAnimationFrame(loop);
    }
}

main();