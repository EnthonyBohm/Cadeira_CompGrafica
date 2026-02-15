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
  gl.activeTexture(gl.TEXTURE0 + 0);

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
            

  var wrapS = gl.REPEAT;
  var wrapT = gl.REPEAT;

  document.querySelector("#wrap_s0").addEventListener('click', function() { wrapS = gl.REPEAT;          drawScene(); });  // eslint-disable-line
  document.querySelector("#wrap_s1").addEventListener('click', function() { wrapS = gl.CLAMP_TO_EDGE;   drawScene(); });  // eslint-disable-line
  document.querySelector("#wrap_s2").addEventListener('click', function() { wrapS = gl.MIRRORED_REPEAT; drawScene(); });  // eslint-disable-line
  document.querySelector("#wrap_t0").addEventListener('click', function() { wrapT = gl.REPEAT;          drawScene(); });  // eslint-disable-line
  document.querySelector("#wrap_t1").addEventListener('click', function() { wrapT = gl.CLAMP_TO_EDGE;   drawScene(); });  // eslint-disable-line
  document.querySelector("#wrap_t2").addEventListener('click', function() { wrapT = gl.MIRRORED_REPEAT; drawScene(); });  // eslint-disable-line

  drawScene();

  window.addEventListener('resize', drawScene);


  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);    
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);                 // Clip Space to Pixel
  
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  
    gl.useProgram(program);

    gl.bindVertexArray(vao);
  
    var scaleFactor = 2.5;
    var size        = 80 * scaleFactor;
    var x           = gl.canvas.clientWidth / 2 - size / 2;
    var y           = gl.canvas.clientHeight / 2 - size - 60;
    gridContainer.style.left = (x - 50 * scaleFactor) + 'px';
    gridContainer.style.top  = (y - 50 * scaleFactor) + 'px';
    gridContainer.style.width  = (scaleFactor * 400) + 'px';
    gridContainer.style.height = (scaleFactor * 300) + 'px';

    var matrix  = m4.orthographic (0, gl.canvas.clientWidth, gl.canvas.clientHeight,0, -1, 1);
    matrix      = m4.translate   (matrix, x, y, 0);
    matrix      = m4.scale       (matrix, size, size, 1);
    matrix      = m4.translate   (matrix, 0.5, 0.5, 0);

    gl.bindTexture  (gl.TEXTURE_2D, texture);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

    gl.uniformMatrix4fv(matrixLoc, false, matrix);


    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 1 * 6;
    gl.drawArrays(primitiveType, offset, count)

  }
}
// Fill the current ARRAY_BUFFER buffer
// with the values that define plane
function setGeometry(gl) {
  var positions = new Float32Array([
      -0.5,  0.5,  0.5,
       0.5,  0.5,  0.5,
      -0.5, -0.5,  0.5,
      -0.5, -0.5,  0.5,
       0.5,  0.5,  0.5,
       0.5, -0.5,  0.5,
  ]);

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the current ARRAY_BUFFER buffer
// with texture coordinates for a plane
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          -3, -1,
           2, -1,
          -3,  4,
          -3,  4,
           2, -1,
           2,  4,
      ]),
      gl.STATIC_DRAW);
}

main();
