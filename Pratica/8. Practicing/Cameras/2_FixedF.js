"use strict";


// Trabalhando com 2D, vale mais a pena considerar um vec2 em vez de vec4, Trabalhando com píxels em vez de Clip Space
var vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec4 a_color;


uniform mat4 u_matrix;

out vec4 v_color;

void main() {

  gl_Position = u_matrix * a_position;


  v_color = a_color;

}
`;

var fragmentShaderSource = `#version 300 es

precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
  outColor = v_color;
}
`;

function main() {
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);

  var arrays = {
    a_position : { numComponents: 3, data : setGeometry(gl),} ,
    a_color    : { numComponents: 3, data : fColors, normalize:true},
  };
  
  var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

  function radToDeg(r) {
    return r*180 / Math.PI;
  }
  function degToRad (d) {
    return d * Math.PI / 180;
  }

  // Variáveis para conter as translações
  var fieldOfViewRadians = degToRad(60);
  var cameraAngleRadians = degToRad(0);



  drawScene();

  // Setup a ui.
  webglLessonsUI.setupSlider("#cameraAngle", {value: radToDeg(cameraAngleRadians), slide: updateCameraAngle, min: -360, max: 360});

  function updateCameraAngle(event, ui) {
    cameraAngleRadians = degToRad(ui.value);
    drawScene();
  }


  function drawScene() {
    
    var numFs = 5;
    var radius = 200;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  
    gl.useProgram(programInfo.program);
  
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    var cameraMatrix = m4.yRotation ( cameraAngleRadians );
    cameraMatrix     = m4.translate ( cameraMatrix, 0, 0, radius * 1.5 );

    var fPosition = [radius, 0, 0];     // Target

    var cameraMatrix  = m4.yRotation(cameraAngleRadians);
    cameraMatrix      = m4.translate(cameraMatrix, 0, 50, radius * 1.5);

    var cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14],
    ];
    var up = [0, 1, 0];

    var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

    var viewMatrix = m4.inverse( cameraMatrix );

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    for ( var ii = 0; ii < numFs; ++ii) {
      var angle = ii * Math.PI * 2 / numFs;
      
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;
      var matrix = m4.translate (viewProjectionMatrix, x, 0, z);

      var uniforms = {
        u_matrix : matrix,
      };
      twgl.setUniforms(gl, uniforms);

      
      twgl.drawBufferInfo(gl, bufferInfo);
    }
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

  return positions;
}

var fColors = new Uint8Array([
          // left column front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // top rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // middle rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // left column back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // top rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // middle rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // top
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,

          // top rung right
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,

          // under top rung
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,

          // between top rung and middle
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,

          // top of middle rung
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,

          // right of middle rung
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,

          // bottom of middle rung.
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,

          // right of bottom
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,

          // bottom
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,

          // left side
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
      ]);


function cross (a,b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}

function subtractVectros (a,b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1]*v[1] + v[2]*v[2]);
  // Garante que não divide por 0
  if (length > 0.0001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0,0,0];
  }
}


main();
