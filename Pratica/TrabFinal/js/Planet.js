const planetParams = {
    radius: 9.0,
    subdivisions: 5,
    roughness: 1,
    rotationSpeed: 0.2,
    seed: Math.random() * 10000,
    numTrees: 0,
};


async function main() {
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  // twgl.setAttributePrefix("a_");

  const planetVertexShader = await loadShader("./shaders/PlanetVs.glsl");   
  const planetFragmentShader = await loadShader("./shaders/PlanetFs.glsl");
  var planetProgramInfo = twgl.createProgramInfo(gl, [planetVertexShader, planetFragmentShader]);

  const TreeVertexShader = await loadShader ("./shaders/TreeVs.glsl");
  const TreeFragmentShader = await loadShader ("./shaders/TreeFs.glsl");

  const shaders = {
    planet : initializePlanet(gl, planetProgramInfo), // programInfo, Vao, NumElements
    tree   : await createObjectData(gl, TreeVertexShader, TreeFragmentShader), // Material, bufferInfo, vao
  };
  
  console.log(shaders.planet.programInfo);
  console.log(shaders.tree);
  
  setupSliders(gl, shaders);

  // ====================== Setting Important Info =====================
  var translation = [0, 0, -10];
  var rotation = [0, 0, 0];
  var scale = [1, 1, 1];
  var fieldOfViewRadians = degToRad(60);

  var globalUniforms = {
    u_lightWorldPosition: [-100, 10, 150],
    }

  var PlanetUniforms = {
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

  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  addMouseInteraction(canvas, rotation);


  function render(now) {
    var cameraMatrix = m4.lookAt(camera, target, up);
    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  // ========= Rotação do Planeta =====
    now *= 0.001;
    var deltaTime = now - then;
    then = now;

  // ========== Rotação do Sol ===========
    var orbitRadius = 100.0;
    var sunSpeed    = 0.5;
    
    globalUniforms.u_lightWorldPosition = [
      Math.sin(now * sunSpeed) * orbitRadius,
      Math.sin(now * 0.1) * 20.0,
      Math.cos(now * sunSpeed) * orbitRadius
    ];


  // ===================== Desenhando o Planeta ====================
    gl.useProgram(shaders.planet.programInfo.program);
    gl.bindVertexArray(shaders.planet.vao);
  
    fRotationRadians += planetParams.rotationSpeed * deltaTime;
  
    var worldMatrix = m4.identity();
    m4.translate(
      worldMatrix,
      translation[0],
      translation[1],
      translation[2],
      worldMatrix
    );
    // globalUniforms.u_lightWorldPosition[0] -= 0.1;
    // globalUniforms.u_lightWorldPosition[1] += 0.5;
    // worldMatrix = m4.yRotate(worldMatrix, fRotationRadians);
    m4.xRotate(worldMatrix, rotation[0], worldMatrix);
    m4.yRotate(worldMatrix, rotation[1], worldMatrix);
    m4.zRotate(worldMatrix, rotation[2], worldMatrix);
    
    PlanetUniforms.u_world = worldMatrix;
    m4.multiply (viewProjectionMatrix, worldMatrix, PlanetUniforms.u_worldViewProjection);
    
    var worldInverseMatrix = m4.inverse(worldMatrix);
    m4.transpose(worldInverseMatrix, PlanetUniforms.u_worldInverseTranspose);
    
    twgl.setUniforms(shaders.planet.programInfo, PlanetUniforms);
    twgl.setUniforms(shaders.planet.programInfo, globalUniforms);
    
    
    gl.drawElements(gl.TRIANGLES, shaders.planet.numElements, gl.UNSIGNED_SHORT, 0);
    
  // ===================== Desenhando as Árvores ====================

    requestAnimationFrame(render);
    }
  requestAnimationFrame(render);
}


async function loadShader (url) { 
    const response = await fetch(url);        // Fetch é feito em relação à pasta raiz Trab e não ao Planet.js.
    return await response.text();
}

function degToRad (d) {
  return d * Math.PI / 180;
}

function initializePlanet (gl, programInfo) {
  var attributes        = createPlanet(planetParams.radius, planetParams.subdivisions, planetParams.roughness, planetParams.seed);
  var planetNumElements = attributes.indices.length;
  var planetBufferInfo  = twgl.createBufferInfoFromArrays(gl, attributes);
  var planetVao         = twgl.createVAOFromBufferInfo (gl, programInfo, planetBufferInfo);

  return {
    programInfo   : programInfo,
    vao           : planetVao,
    numElements   : planetNumElements,
  };
}


initNoise();
main();


