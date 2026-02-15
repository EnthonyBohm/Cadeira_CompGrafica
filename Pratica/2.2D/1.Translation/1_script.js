"use strict";


// Trabalhando com 2D, vale mais a pena considerar um vec2 em vez de vec4, Trabalhando com píxels em vez de Clip Space
var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
// --in vec4 a_position;--
in vec2 a_position;

// Variavel global
uniform vec2 u_resolution;

// all shaders have a main function
void main() {
    // Converte de píxels para [0, 1]
    vec2 zeroToOne = a_position / u_resolution;

    // Converte de [0,1] para [0,2]
    vec2 zeroToTwo = zeroToOne * 2.0;

    // Converte de [0,1] para [-1, +1]
    vec2 clipSpace = zeroToTwo - 1.0;

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    //                                  (x,y,0,1)
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
  // Get A WebGL context
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // Link the two shaders into a program
  var program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);
  
  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  
  
  var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  var colorLocation = gl.getUniformLocation(program, "u_color");

  
  var positionBuffer = gl.createBuffer();
  
  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);


  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);


  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  // Variáveis de Translação
  var translation = [0,0];
  var width = 100;
  var height = 30;
  var color = [Math.random(), Math.random(), Math.random(), 1];

  drawScene();
  
  // Adicinando uma UI.
  webLessonsUI.setupSlider("#x", {slide:updatePostion(0), max: gl.canvas.width });
  webLessonsUI.setupSlider("#y", {slide:updatePostion(1), max: gl.canvas.height });

  function updatePostion(index) {
    return function (event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function drawScene() {
  
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);
  
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, translation[0], translation[1], width, height);
    
    // Setta uma cor aleatória
    gl.uniform4fv(colorLocation, color);
  
    // Desenha Retângulo
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count)

  }

}

// Fill the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
}

main();
