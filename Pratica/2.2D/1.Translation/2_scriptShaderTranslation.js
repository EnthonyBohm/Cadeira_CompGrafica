"use strict";


// Trabalhando com 2D, vale mais a pena considerar um vec2 em vez de vec4, Trabalhando com píxels em vez de Clip Space
var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
// --in vec4 a_position;--
in vec2 a_position;

// Variavel global
uniform vec2 u_resolution;

// Translation to add to Position
uniform vec2 u_translation;

// all shaders have a main function
void main() {
  // Adiciona a Translação
  vec2 position = a_position + u_translation;

  vec2 zeroToOne = position / u_resolution;

  vec2 zeroToTwo = zeroToOne * 2.0;

  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1,-1),0,1);
}
`;

var fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// Variável global que define a cor
uniform vec4 u_color;

// Conjunto de dados que define a cor do fragmento.
out vec4 outColor;

void main() {
  // Just set the output to a constant redish-purple
  outColor = u_color;
}
`;

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
  gl.deleteProgram(program);
  return undefined;
}

function main() {
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);
  
  var positionAttributeLocation = gl.getAttribLocation (program, "a_position");
  
  var resolutionUniformLocation = gl.getUniformLocation (program, "u_resolution");
  var colorLocation = gl.getUniformLocation (program, "u_color");
  var translationLocation = gl.getUniformLocation (program, "u_translation");

  
  var positionBuffer = gl.createBuffer();
  
  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  setGeometry(gl);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  var translation = [0,0];
  var color = [Math.random(), Math.random(), Math.random(), 1];

  drawScene();
  
  webglLessonsUI.setupSlider("#x", {slide: updatePosition(0), max: gl.canvas.width });
  webglLessonsUI.setupSlider("#y", {slide: updatePosition(1), max: gl.canvas.height});

  function updatePosition(index) {
    return function (event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function drawScene() {
  
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    gl.useProgram(program);

    // Bind the attribute/buffer we want
    gl.bindVertexArray(vao);
  
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        
    gl.uniform4fv(colorLocation, color);

    gl.uniform2fv(translationLocation, translation);
  
    // Desenha Retângulo
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;
    gl.drawArrays(primitiveType, offset, count)

  }

}

function setGeometry(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // left column
      0, 0,
      30, 0,
      0, 150,
      0, 150,
      30, 0,
      30, 150,

      // top rung
      30, 0,
      100, 0,
      30, 30,
      30, 30,
      100, 0,
      100, 30,

      // middle rung
      30, 60,
      67, 60,
      30, 90,
      30, 90,
      67, 60,
      67, 90]),
      gl.STATIC_DRAW);
}

main();
