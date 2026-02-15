"use strict";


// Trabalhando com 2D, vale mais a pena considerar um vec2 em vez de vec4, Trabalhando com píxels em vez de Clip Space
var vs = `#version 300 es

in vec4   a_position;
in vec3   a_normal;
in float  a_elevation;

uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

uniform mat4 u_world;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

out vec3  v_normal;
out vec3  v_surfaceToLight;
out float v_elevation;


void main() {
  gl_Position = u_worldViewProjection * a_position;
  v_elevation = a_elevation;
  v_normal = mat3(u_worldInverseTranspose) * a_normal;

  vec3 surfaceWorldPosition = (u_world * a_position).xyz;

  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
}
`;

var fs = `#version 300 es

precision highp float;

in vec3 v_normal;
in vec3 v_surfaceToLight;
in float v_elevation;

uniform vec4 u_color;
uniform vec3 u_reverseLightDirection;

out vec4 outColor;

void main() {
  vec3 normal = normalize(v_normal);
  // Ajuste a direção da luz - use valores mais razoáveis
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

  float light       = max ( dot (normal, surfaceToLightDirection), 0.3);

  

  // Cores base
  vec3 deepWaterColor = vec3(0.05, 0.15, 0.3);
  vec3 shallowWaterColor = vec3(0.05, 0.15, 0.4);
  vec3 sandColor = vec3(0.8, 0.7, 0.5);
  vec3 grassColor = vec3(0.2, 0.5, 0.1);
  vec3 mountainColor = vec3(0.4, 0.35, 0.3);
  vec3 snowColor = vec3(0.9, 0.9, 1.0);

  // Cores de luz

  vec3 finalColor;

  if      (v_elevation < -0.4)  { finalColor = deepWaterColor;}
  else if (v_elevation < -0.21) { finalColor = shallowWaterColor;}
  else if (v_elevation < -0.19) { finalColor = sandColor; }
  else if (v_elevation < 0.22){ finalColor = grassColor; }
  else { finalColor = mountainColor;}

  outColor = vec4(finalColor * light, 1) ;
}
`;

var planetParams = {
    radius: 9.0,
    subdivisions: 5,
    roughness: 1,
    rotationSpeed: 0.2,
    seed: Math.random() * 10000,
  };

function main() {
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  var attributes = createPlanet(planetParams.radius, planetParams.subdivisions, planetParams.roughness, planetParams.seed);
  var bufferInfo = twgl.createBufferInfoFromArrays(gl, attributes);


  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);


  function radToDeg(r) {
    return r*180 / Math.PI;
  }
  function degToRad (d) {
    return d * Math.PI / 180;
  }

  
  const container = setupSliders();
  container.addEventListener("input", (event) => {
    if (event.target.type = "range"){
      planetParams[event.target.dataset.id] = Number(event.target.value);
    }
  })
  container.addEventListener("click", (event) => {
    if (event.target.dataset.action === "update"){
      
      updatePlanet();
    }
  })

  // ============== Mouse Listener, para mover Planeta ==========
  var isDragging = false;
  var lastMouseX = 0;
  var lastMouseY = 0;

  const sensibility = 0.0025;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;   
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  })
  
  canvas.addEventListener('mousemove', (e) => {
    if (isDragging == false) return          

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    

    rotation[1] += deltaX * sensibility;
    rotation[0] += deltaY * sensibility;

    const limit = Math.PI / 2 - 0.01;
    if (rotation[0] > limit) rotation[0] = limit;
    if (rotation[0] < -limit) rotation[0] = -limit;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  })


  // ====================== Atualiza Informações do Planeta ================
  function updatePlanet() {
    console.log("Atualizando planeta com:", planetParams);
    planetParams.seed = Math.random() * 10000;
    
    // Criar novo planeta com os parâmetros atualizados
    attributes = createPlanet(
      planetParams.radius, 
      planetParams.subdivisions, 
      planetParams.roughness,
      planetParams.seed
    );
    
    // Atualizar buffers
    bufferInfo = twgl.createBufferInfoFromArrays(gl, attributes);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    requestAnimationFrame(drawScene);

  }



  // ====================== Setting Important Info =====================
  var translation = [0, 0, -10];
  var rotation = [0, 0, 0];
  var scale = [1, 1, 1];
  var fieldOfViewRadians = degToRad(60);

  var globalUniforms = {
    u_lightWorldPosition: [-100, 10, 150],
    }

  var uniformsUniqueToObjects = {
    u_world: m4.identity(),
    u_worldViewProjection: m4.identity(),
    u_worldInverseTranspose: m4.identity(),
  };

  var fRotationRadians = 0;

  var then = 0;


// Computa o Frustrum inicial e a projeção
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var zNear = 1;
  var zFar = 2000;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

  //  Computa a camera
  var camera = [0, 0, 10]
  var target = [0, 0, 0];
  var up     = [0, 1, 0];
  var cameraMatrix = m4.lookAt(camera, target, up);
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  requestAnimationFrame(drawScene);

  function drawScene(now) {
    // ========= Rotação do Planeta =====
    now *= 0.001;
    var deltaTime = now - then;
    then = now;

    // ========== Rotação do Sol ===========
    // var orbitRadius = 100.0;
    // var sunSpeed    = 0.5;
    
    // globalUniforms.u_lightWorldPosition = [
    //   Math.sin(now * sunSpeed) * orbitRadius,
    //   Math.sin(now * 0.1) * 20.0,
    //   Math.cos(now * sunSpeed) * orbitRadius
    // ];


    

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.useProgram(programInfo.program);

    fRotationRadians += planetParams.rotationSpeed * deltaTime;

    // globalUniforms.u_lightWorldPosition[0] -= 0.1;
    // globalUniforms.u_lightWorldPosition[1] += 0.5;


    

    var worldMatrix = m4.identity();
    worldMatrix = m4.translate(worldMatrix,
                              translation[0],
                              translation[1],
                              translation[2]);
    // worldMatrix = m4.yRotate(worldMatrix, fRotationRadians);
    worldMatrix = m4.xRotate(worldMatrix, rotation[0]);
    worldMatrix = m4.yRotate(worldMatrix, rotation[1]);
    worldMatrix = m4.zRotate(worldMatrix, rotation[2]);

    uniformsUniqueToObjects.u_world = worldMatrix;
    uniformsUniqueToObjects.u_worldViewProjection = m4.multiply (viewProjectionMatrix, worldMatrix);

    var worldInverseMatrix = m4.inverse(worldMatrix);
    uniformsUniqueToObjects.u_worldInverseTranspose = m4.transpose(worldInverseMatrix);

    twgl.setUniforms(programInfo, uniformsUniqueToObjects);
    twgl.setUniforms(programInfo, globalUniforms);
    

    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    

    requestAnimationFrame(drawScene);
    }
}


// =============== Planet Creation ============================

function createPlanet (radius, subdivisions, roughness, seed) {
  var sphere = createIcosphere( radius, subdivisions);

  var vertices = sphere.a_position.data;
  var normals  = sphere.a_normal.data;
  var indices  = sphere.indices;
  var elevation = sphere.a_elevation.data;

  
  console.log(sphere.a_elevation.data.length);
  

  var originalVertices = vertices.slice();

  for (var i=0; i < vertices.length; i += 3){
    var vertexIndex = i/3;
    var nx = normals[i];
    var ny = normals[i + 1];
    var nz = normals[i + 2];

    if(roughness != 0){
      var frequency = 3.0
      var noise = simpleNoise(nx * frequency, ny * frequency, nz * frequency, seed);

      var amplitude       = 1.0;
      var totalAmplitude  = 1.0;

      amplitude *= 0.5;
      totalAmplitude += amplitude
      noise += amplitude * simpleNoise(
        nx * frequency * 2,
        ny * frequency * 2,
        nz * frequency * 2,
        seed + 1000
      );

      amplitude *= 0.5;
      totalAmplitude += amplitude;
      noise += amplitude * simpleNoise (
        nx * frequency * 4,
        ny * frequency * 4,
        nz * frequency * 4,
        seed + 2000
      );

      noise = noise / totalAmplitude;
      
      // console.log(`Ruido normalizado: ${noise.toFixed(3)}`);
      

      // Aplica ruído ao raio
      var displacement = noise * roughness;
      
      elevation[vertexIndex] = displacement;
      vertices[i] = originalVertices[i] + nx * displacement;
      vertices[i + 1] = originalVertices[i+1] + ny * displacement;
      vertices[i + 2] = originalVertices[i+2] + nz * displacement;
    }
  }
  var newNormals            = calculateSmoothNormals(vertices, indices);

  // recalcular normais após modificar os vértices
  sphere.a_position.data    = vertices;
  sphere.a_normal.data      = newNormals;
  sphere.a_elevation.data   = elevation;
  
  return sphere;
}

// =============== Sphere Mesh Generation ==================
function createIcosphere(radius, subdivisions) {
  // Proporção Áurea
  var pA = (1 + Math.sqrt(5)) / 2;

  // Vértices do icosaedro normalizados
  var positions = [
    [-1, pA, 0], [1, pA, 0], [-1, -pA, 0], [1, -pA, 0],
    [0, -1, pA], [0, 1, pA], [0, -1, -pA], [0, 1, -pA],
    [pA, 0, -1], [pA, 0, 1], [-pA, 0, -1], [-pA, 0, 1]
  ];
  
  var vertices = [];
  positions.forEach( v => {
    var len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    vertices.push([
      v[0] / len,
      v[1] / len,
      v[2] / len
    ]);
  });

  // Índices dos triângulos
  var indices = [
    0, 11, 5,  0, 5, 1,  0, 1, 7,  0, 7, 10,  0, 10, 11,
    1, 5, 9,  5, 11, 4,  11, 10, 2,  10, 7, 6,  7, 1, 8,
    3, 9, 4,  3, 4, 2,  3, 2, 6,  3, 6, 8,  3, 8, 9,
    4, 9, 5,  2, 4, 11,  6, 2, 10,  8, 6, 7,  9, 8, 1
  ];

  for (var i = 0; i < subdivisions; i++) {
    var result = subdivideMesh(vertices, indices);
    vertices = result.vertices;
    indices  = result.indices; 
  }

  var flatVertices = [];
  vertices.forEach(v => {
    flatVertices.push(v[0] * radius, v[1] * radius, v[2] * radius);
  });

  var normals = [];
  for (var i = 0; i < flatVertices.length; i += 3) {
    var x = flatVertices[i];
    var y = flatVertices[i + 1];
    var z = flatVertices[i + 2];
    var len = Math.sqrt(x*x + y*y + z*z);
    normals.push(x/len, y/len, z/len);
  }

  
  
  return {
    a_position:   {numComponents: 3, data: new Float32Array(flatVertices),},
    a_normal:     {numComponents: 3, data: new Float32Array(normals),},
    a_elevation:  {numComponents: 1, data: new Float32Array(flatVertices.length / 3)},
    indices:      new Uint16Array(indices),
  };
}

function subdivideMesh (vertices, indices) {
  var newVertices = vertices.slice();
  var newIndices  = [];
  var cache       = {};

  function getMidPoint (p1, p2) {
    var key = p1 < p2 ? p1 + "_" + p2 : p2+"_"+p1;

    if (cache[key] !== undefined) 
      return cache[key];

    var v1 = newVertices[p1];
    var v2 = newVertices[p2];

    var mid = [
      (v1[0] + v2[0]) / 2,
      (v1[1] + v2[1]) / 2,
      (v1[2] + v2[2]) / 2
    ];

    var len = Math.sqrt(mid[0]**2 + mid[1]**2 + mid[2]**2);
    mid[0] /= len;
    mid[1] /= len;
    mid[2] /= len;

    newVertices.push(mid);
    var midIndex = newVertices.length - 1;

    cache[key] = midIndex;
    return midIndex;
  }

  for (var i = 0; i < indices.length; i+=3) {
    var i1 = indices[i];
    var i2 = indices[i+1];
    var i3 = indices[i+2];

    // Ponto médio de cada aresta
    var a = getMidPoint(i1, i2);
    var b = getMidPoint(i2, i3);
    var c = getMidPoint(i3, i1);

    // Cria 4 novos triangulos
    newIndices.push(i1, a, c);
    newIndices.push(i2, b, a);
    newIndices.push(i3, c, b);
    newIndices.push(a, b, c);
  }

  return {
    vertices: newVertices,
    indices : newIndices
  };
}



// ================ Math Functions =========================
function calculateSmoothNormals(vertices, indices) {
    var normals = new Array(vertices.length).fill(0);

    for (var i = 0; i < indices.length; i += 3) {
      var idx0 = indices[i];
      var idx1 = indices[i + 1];
      var idx2 = indices[i + 2];

      var i0 = idx0 * 3;
      var i1 = idx1 * 3;
      var i2 = idx2 * 3;

      var v0 = [vertices[i0], vertices[i0 + 1], vertices[i0 + 2]];
      var v1 = [vertices[i1], vertices[i1 + 1], vertices[i1 + 2]];
      var v2 = [vertices[i2], vertices[i2 + 1], vertices[i2 + 2]];

      const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
      const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

      const nx = edge1[1] * edge2[2] - edge1[2] * edge2[1];
      const ny = edge1[2] * edge2[0] - edge1[0] * edge2[2];
      const nz = edge1[0] * edge2[1] - edge1[1] * edge2[0];

      // Acumular nos 3 vértices - CORRIGIDO: usar índices corretos
      normals[i0] += nx; normals[i0 + 1] += ny; normals[i0 + 2] += nz;
      normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
      normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
    }

    // Normalizar as Normais
    for (var i = 0; i < normals.length; i += 3) {
      const len = Math.sqrt(normals[i] ** 2 + normals[i + 1] ** 2 + normals[i + 2] ** 2);
      if (len > 0) {
        normals[i] /= len;
        normals[i + 1] /= len;
        normals[i + 2] /= len;
      }
    }

    return normals;
}

// Função de ruído simples (pode usar uma biblioteca de noise)
function simpleNoise(x, y, z, seed) {
  // Implementação simples de ruído - para melhor qualidade use Perlin/Simplex noise  
  var p = initPermutation(seed)
  
  var X = Math.floor(x) & 255;
  var Y = Math.floor(y) & 255;
  var Z = Math.floor(z) & 255;
  
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  
  var u = fade(x);
  var v = fade(y);
  var w = fade(z);
  
  var A = p[X] + Y;
  var AA = p[A] + Z;
  var AB = p[A + 1] + Z;
  var B = p[X + 1] + Y;
  var BA = p[B] + Z;
  var BB = p[B + 1] + Z;
  
  return lerp(
    lerp(
      lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
      lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u),
      v
    ),
    lerp(
      lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
      lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u),
      v
    ),
    w
  );
}

function initPermutation (seed) {
  var p = new Array(512);
  var permutation = new Array(256);

  for (var i=0; i<256; i++){
    permutation[i] = i;
  }

  var rng = mullbery32(seed);
  for (var i = 255; i>0; i--) {
    var j = Math.floor(rng()*(i+1));
    var temp = permutation[i];
    permutation[i] = permutation[j];
    permutation[j] = temp;
  }

  for (var i=0; i<256; i++) {
    p[i] = permutation[i];
    p[256+i] = permutation[i];
  }

  return p;
}

function mullbery32(a) {
  return function () {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 7, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t^t >>> 14) >>> 0) / 4294967296;
  };
}

function fract(value) { return value - Math.floor(value); }

function lerp(a,b,t) { return a+t * (b-a); }

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

function grad(hash, x, y, z) {
  var h = hash & 15;
  var u = h < 8 ? x : y;
  var v = h < 4 ? y : h == 12 || h == 14 ? x : z;
  return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

// Arrays de permutação para o ruído (simplificado)
var p = [];
function initNoise() {
  for (var i = 0; i < 256; i++) {
    p[i] = Math.floor(Math.random() * 256);
  }
  for (var i = 0; i < 256; i++) {
    p[256 + i] = p[i];
  }
}


// function calculateVertexFeatures (vertices, normals, indices, center = [0, 0, 0]){
//   var features = new Float32Array(vertices.length/ 3);

//   var stats = {
//     min: Infinity,
//     max: -Infinity,
//     count: 0,
//     distribution: {'-1':0 , '0':0, '1':0}
//   };

//   for (var i = 0; i < vertices.length; i+=3) {
//     var vertexIndex   = i/3;
//     var vx            = vertices[i];
//     var vy            = vertices[i+1];
//     var vz            = vertices[i+2];

//     var nx            = normals[i];
//     var ny            = normals[i+1];
//     var nz            = normals[i+2];

//     var toCenterX      = vx - center[0];
//     var toCenterY      = vy - center[1];
//     var toCenterZ      = vz - center[2];
    
//     var len = Math.sqrt(toCenterX ** 2 + toCenterY ** 2 + toCenterZ ** 2);
//     toCenterX /= len;
//     toCenterY /= len;
//     toCenterZ /= len;

//     var radialAligment = nx * toCenterX + ny * toCenterY + nz * toCenterZ;

//     console.log(`Vértice ${vertexIndex}: convexity=${radialAligment.toFixed(3)}`);

//     var featureCode;
//     if      (radialAligment < 0)    featureCode = -1.0;
//     else if (radialAligment < 0.7)  featureCode = 0.0 ;
//     else                            featureCode = 1.0 ;

//     features[vertexIndex] = featureCode;
//     // console.log("index:"+i  +" - RadAlign:"+radialAligment +  " - Val:"+featureCode);
//   }



//   return features;
// }

// ===================== GUI ====================

function setupSliders () {
  function createSlider({min, max, step, value, id}){
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min  = min;
    slider.max  = max;
    slider.step = step;
    slider.value = value;
    slider.dataset.id = id;
    return slider;
  }
  function createUpdateButton () {
    const b = document.createElement("button");
    b.textContent = "Update";
    b.dataset.action = "update";
    return b;
  }

  const container = document.getElementById("controls");

  container.appendChild (
    createSlider({min:0, max:300, step:1, value:20, id:"maxArvores"})
  );
  container.appendChild (
    createSlider({min:0, max:300, step:1, value:20, id:"maxPedras"})
  );
  container.appendChild (
    createSlider({min:0, max:300, step:1, value:20, id:"tamArvores"})
  );
  container.appendChild (
    createSlider({min:0, max:300, step:1, value:20, id:"tamPedras"})
  );
  container.appendChild (
    createSlider({min:0.5, max:10, step:0.5, value:planetParams.radius, id:"radius"})
  );
  container.appendChild (
    createSlider({min:1, max:7, step:1, value:planetParams.subdivisions, id:"subdivisions"})
  );
  container.appendChild (
    createSlider({min:0.00, max:4, step:0.05, value:planetParams.roughness, id:"roughness"})
  );
  container.appendChild (
    createUpdateButton()
  );
  
  return container;
}



initNoise();
main();


