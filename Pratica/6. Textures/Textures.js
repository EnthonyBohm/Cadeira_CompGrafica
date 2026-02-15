"use strict";


// Trabalhando com 2D, vale mais a pena considerar um vec2 em vez de vec4, Trabalhando com píxels em vez de Clip Space
var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_matrix;

// um Varying para passar as coordenadas da textura
out vec2 v_texcoord;

void main() {
  gl_Position = u_matrix * a_position;

  v_texcoord = a_texcoord;
}
`;

var fragmentShaderSource = `#version 300 es

precision highp float;

// Vindo do VS
in vec2 v_texcoord;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  outColor = texture(u_texture, v_texcoord);
}
`;

function main() {
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);
  
  var positionAttributeLocation   = gl.getAttribLocation (program, "a_position");
  var texcoordAttributeLoc        = gl.getAttribLocation (program, "a_texcoord");

  var matrixLoc                 = gl.getUniformLocation (program, "u_matrix");

  var positionBuffer = gl.createBuffer();
  var vao = gl.createVertexArray();
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


  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  setTexcoords(gl);
  gl.enableVertexAttribArray(texcoordAttributeLoc);
  gl.vertexAttribPointer(
    texcoordAttributeLoc, 2, gl.FLOAT, true, 0, 0);
  
  // Cria uma Textura
  var texture = gl.createTexture();

  // Usa unidade de Textura 0
  gl.activeTexture(gl.TEXTURE + 0);

  // conecta ao TEXTURE_2D bind point da unidade de Textura 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Preenche a textura com um pixel 1x1 azul
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0,0,255,255]));
  
  // Carrega uma imagem de forma assincrona
  var image = new Image();
  image.src = "../WebGl2Fundamentals/webgl/resources/f-texture.png";
  image.addEventListener('load',function() {
    // Agora que a imagem foi carrega, faz uma copia dela à textura
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  });
            

  function degToRad (d) {
    return d * Math.PI / 180;
  }

  // Variáveis para conter as translações
  var fieldOfViewRadians    = degToRad(60);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  var then = 0;

  requestAnimationFrame(drawScene);


  function drawScene(now) {

    now *= 0.001;

    var deltaTime = now - then;

    then = now;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);    
    
    // Anima a rotação
    modelXRotationRadians += 1.2 * deltaTime;
    modelYRotationRadians += 0.7 * deltaTime;
  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);                 // Clip Space to Pixel
  
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  
    gl.useProgram(program);

    gl.bindVertexArray(vao);
  
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
    
    var cameraPosition  = [0, 0, 200];
    var up              = [0, 1, 0];
    var target          = [0, 0, 0];

    var cameraMatrix          = m4.lookAt(cameraPosition, target, up);

    var viewMatrix            = m4.inverse(cameraMatrix);

    var viewProjectionMatrix  = m4.multiply(projectionMatrix, viewMatrix);

    var matrix                = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
    matrix                    = m4.yRotate(matrix, modelYRotationRadians);

    gl.uniformMatrix4fv(matrixLoc, false, matrix);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count)

    requestAnimationFrame(drawScene);
  }
}


// Fill the current ARRAY_BUFFER buffer
// with the values that define a letter 'F'.
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
  var matrix = m4.translate(m4.xRotation(Math.PI), -50, -75, -15);
  //var matrix = m4.xRotate(m4.translation(-50, -75, -15), Math.PI);

  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.transformPoint(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
    positions[ii + 0] = vector[0];
    positions[ii + 1] = vector[1];
    positions[ii + 2] = vector[2];
  }

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the current ARRAY_BUFFER buffer
// with texture coordinates for the letter 'F'.
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // left column front
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        // top rung front
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        // middle rung front
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        // left column back
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        // top rung back
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        // middle rung back
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        // top
        0, 0,
        1, 0,
        1, 1,
        0, 0,
        1, 1,
        0, 1,

        // top rung right
        0, 0,
        1, 0,
        1, 1,
        0, 0,
        1, 1,
        0, 1,

        // under top rung
        0, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 1,
        1, 0,

        // between top rung and middle
        0, 0,
        1, 1,
        0, 1,
        0, 0,
        1, 0,
        1, 1,

        // top of middle rung
        0, 0,
        1, 1,
        0, 1,
        0, 0,
        1, 0,
        1, 1,

        // right of middle rung
        0, 0,
        1, 1,
        0, 1,
        0, 0,
        1, 0,
        1, 1,

        // bottom of middle rung.
        0, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 1,
        1, 0,

        // right of bottom
        0, 0,
        1, 1,
        0, 1,
        0, 0,
        1, 0,
        1, 1,

        // bottom
        0, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 1,
        1, 0,

        // left side
        0, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 1,
        1, 0,
      ]),
      gl.STATIC_DRAW);
}
main();
