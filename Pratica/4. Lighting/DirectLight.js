"use strict";


// Trabalhando com 2D, vale mais a pena considerar um vec2 em vez de vec4, Trabalhando com píxels em vez de Clip Space
var vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

out vec3 v_normal;

void main() {

  gl_Position = u_worldViewProjection * a_position;

  v_normal = mat3(u_worldInverseTranspose) * a_normal;
  
}
`;

var fragmentShaderSource = `#version 300 es

precision highp float;

in vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;

// Saida para o fs.
out vec4 outColor;

void main() {
  // Como v_normal varia, é interpolada, então nao vai ser um Unit Vector.
  // Normalizar vai transformar em um Unit Vector novamente.
  vec3 normal = normalize (v_normal);

  // Calcula a luz com o produto vetorial da normal com a direção inversa da luz
  float light = dot (normal, u_reverseLightDirection);

  outColor = u_color;

  outColor.rgb *= light;
}
`;

function main() {
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);
  
  var positionAttributeLocation = gl.getAttribLocation (program, "a_position");
  var normalLocation = gl.getAttribLocation  (program, "a_normal");
  
  // Busca pelos Uniformes de u_world
  var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
  var worldInverseTransposeLocation = gl.getUniformLocation (program, "u_worldInverseTranspose");

  var colorLocation  = gl.getUniformLocation (program, "u_color");
  var reverseLightDirectionLocation = gl.getUniformLocation (program, "u_reverseLightDirection");


  var positionBuffer = gl.createBuffer();
  var vao = gl.createVertexArray();
  console.log(vao);
  
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);



  // Cria Buffer para as Normais
  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.enableVertexAttribArray(normalLocation);
  // Define as Normais
  setNormals(gl);
  
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);


  function radToDeg(r) {
    return r*180 / Math.PI;
  }
  function degToRad (d) {
    return d * Math.PI / 180;
  }

  // Variáveis para conter as translações
  var fieldOfViewRadians = degToRad(60);
  var fRotationRadians = 0;



  drawScene();


  // Setup a ui.
  webglLessonsUI.setupSlider("#fRotation", {value: radToDeg(fRotationRadians), slide: updateRotation, min: -360, max: 360});

  function updateRotation(event, ui) {
    fRotationRadians = degToRad(ui.value);
    drawScene();
  }

  function drawScene() {

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);                      
  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);                 // Clip Space to Pixel
  
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  
    gl.useProgram(program);

  
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);


    //Computa a Matriz da Camera
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up     = [0, 1, 0];
    var cameraMatrix = m4.lookAt(camera, target, up);
    
    // Faz uma matriz de visualização com a matriz da câmera
    var viewMatrix = m4.inverse( cameraMatrix );

    // Matriz de visão e projeção. Aplica perspectiva e setta a câmera como Origem
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Define as novas Matrizes para World e WorldProjectionView
    var worldMatrix = m4.yRotation(fRotationRadians);
    var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
    var worldInverseMatrix = m4.inverse(worldMatrix);
    var worldInverseTranposeMatrix = m4.transpose(worldInverseMatrix);

    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation,false, worldInverseTranposeMatrix);

    // Define a cor
    gl.uniform4fv (colorLocation, [0.2, 1, 0.2, 1]);        // Green

    // Define a direçao da luz
    gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));


    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count)
  }
}



function setGeometry(gl) {
  var positions = new Float32Array([
          // left column front
          0,   0,  0,
          0, 150,  0,
          30,   0,  0,
          0, 150,  0,
          30, 150,  0,
          30,   0,  0,

          // top rung front
          30,   0,  0,
          30,  30,  0,
          100,   0,  0,
          30,  30,  0,
          100,  30,  0,
          100,   0,  0,

          // middle rung front
          30,  60,  0,
          30,  90,  0,
          67,  60,  0,
          30,  90,  0,
          67,  90,  0,
          67,  60,  0,

          // left column back
            0,   0,  30,
           30,   0,  30,
            0, 150,  30,
            0, 150,  30,
           30,   0,  30,
           30, 150,  30,

          // top rung back
           30,   0,  30,
          100,   0,  30,
           30,  30,  30,
           30,  30,  30,
          100,   0,  30,
          100,  30,  30,

          // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

          // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,
            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

          // top rung right
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

          // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

          // between top rung and middle
          30,   30,   0,
          30,   60,  30,
          30,   30,  30,
          30,   30,   0,
          30,   60,   0,
          30,   60,  30,

          // top of middle rung
          30,   60,   0,
          67,   60,  30,
          30,   60,  30,
          30,   60,   0,
          67,   60,   0,
          67,   60,  30,

          // right of middle rung
          67,   60,   0,
          67,   90,  30,
          67,   60,  30,
          67,   60,   0,
          67,   90,   0,
          67,   90,  30,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // right of bottom
          30,   90,   0,
          30,  150,  30,
          30,   90,  30,
          30,   90,   0,
          30,  150,   0,
          30,  150,  30,

          // bottom
          0,   150,   0,
          0,   150,  30,
          30,  150,  30,
          0,   150,   0,
          30,  150,  30,
          30,  150,   0,

          // left side
          0,   0,   0,
          0,   0,  30,
          0, 150,  30,
          0,   0,   0,
          0, 150,  30,
          0, 150,   0,
  ]);

  // Center the F around the origin and Flip it around. We do this because
  // we're in 3D now with and +Y is up where as before when we started with 2D
  // we had +Y as down.

  // We could do by changing all the values above but I'm lazy.
  // We could also do it with a matrix at draw time but you should
  // never do stuff at draw time if you can do it at init time.
  var matrix = m4.xRotation(Math.PI);
  matrix = m4.translate(matrix, -50, -75, -15);

  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.transformVector(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
    positions[ii + 0] = vector[0];
    positions[ii + 1] = vector[1];
    positions[ii + 2] = vector[2];
  }

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function setNormals(gl) {
  var normals = new Float32Array([
          // left column front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
  
          // top rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
  
          // middle rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
  
          // left column back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
  
          // top rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
  
          // middle rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
  
          // top
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
  
          // top rung right
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
  
          // under top rung
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
  
          // between top rung and middle
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
  
          // top of middle rung
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
  
          // right of middle rung
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
  
          // bottom of middle rung.
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
  
          // right of bottom
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
  
          // bottom
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
  
          // left side
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}


main();
