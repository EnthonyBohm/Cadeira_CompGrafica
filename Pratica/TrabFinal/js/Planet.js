const planetParams = {
    radius: 9.0,
    subdivisions: 5,
    roughness: 1,
    rotationSpeed: 0.2,
    seed: Math.random() * 10000,
    numTrees: 500,
};

var trees = [];

async function main() {
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  const planetVertexShader = await loadShader("./shaders/PlanetVs.glsl");   
  const planetFragmentShader = await loadShader("./shaders/PlanetFs.glsl");
  const planetProgramInfo = twgl.createProgramInfo(gl, [planetVertexShader, planetFragmentShader]);
  
  // twgl.setAttributePrefix("a_");
  const TreeVertexShader = await loadShader ("./shaders/TreeVs.glsl");
  const TreeFragmentShader = await loadShader ("./shaders/TreeFs.glsl");
  const meshProgramInfo = twgl.createProgramInfo (gl, [TreeVertexShader,TreeFragmentShader]);

  
  const shaders = {
    planet : initializePlanet(gl, planetProgramInfo), // programInfo, Vao, NumElements
    tree   : {programInfo: meshProgramInfo ,
              data: (await createObjectData(gl, meshProgramInfo)).at(0)}, // Material, bufferInfo, vao
  };
  
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
  
  
    const treeTexture = twgl.createTexture(gl, {
          src: '../../ForestModels/Assets/obj/forest_texture.png',
          flipY:true,
      });
  var treeSharedUniforms = {
      u_texture: treeTexture,
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
    // var orbitRadius = 100.0;
    // var sunSpeed    = 0.5;
    
    // globalUniforms.u_lightWorldPosition = [
    //   Math.sin(now * sunSpeed) * orbitRadius,
    //   Math.sin(now * 0.1) * 20.0,
    //   Math.cos(now * sunSpeed) * orbitRadius
    // ];


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
    gl.useProgram(shaders.tree.programInfo.program);
    gl.bindVertexArray(shaders.tree.data.vao);
    
    for (let point of trees) {
      var len = Math.sqrt(point[0]**2 + point[1]**2 + point[2]**2);
      var nx = point[0]/len; var ny =  point[1]/len; var nz = point[2]/len;
      var displacement = getDisplacementAtpoint(
        nx, 
        ny,
        nz,
        3.0,
        planetParams.roughness,
        planetParams.seed );
      var finalRadius = planetParams.radius + displacement;
      var position = [
        nx * finalRadius,
        ny * finalRadius,
        nz * finalRadius,
      ];
      var normal = [nx, ny, nz];
      var axis = m4.cross(up, normal);
      var dotProduct = m4.dot(up, normal)
      var angle = Math.acos(dotProduct);

      // Clamp para evitar NaN devido a erros de precisão
      dotProduct = Math.max(-1, Math.min(1, dotProduct));
      var angle = Math.acos(dotProduct);
      
      // Trata caso onde normal já está alinhada com up
      if (Math.abs(axis[0]) < 0.0001 && Math.abs(axis[1]) < 0.0001 && Math.abs(axis[2]) < 0.0001) {
        axis = [1, 0, 0];
        angle = 0;
      }

      var scale = planetParams.radius * 0.025;
      var scaleMatrix = m4.scaling(scale, scale, scale);
    
      var rotationMatrix = m4.axisRotation(axis, angle);
      
      var localTreeMatrix = m4.identity();    // Sem transformar para o planeta
      m4.translate(localTreeMatrix, position[0], position[1], position[2], localTreeMatrix);
      m4.multiply(localTreeMatrix, rotationMatrix, localTreeMatrix);
      m4.multiply(localTreeMatrix, scaleMatrix, localTreeMatrix);

      worldMatrix = m4.multiply(PlanetUniforms.u_world, localTreeMatrix);
      var worldViewProjection   = m4.multiply(viewProjectionMatrix, worldMatrix);
      var worldInverseTranspose = m4.transpose(m4.inverse(worldMatrix));

      
      
      

      twgl.setUniforms(shaders.tree.programInfo, {
        u_world: worldMatrix,
        u_worldViewProjection: worldViewProjection,
        u_worldInverseTranspose: worldInverseTranspose,
        u_texture: treeTexture,
        u_time : now,
      }, globalUniforms, treeSharedUniforms, shaders.tree.data.material);      

      gl.drawArrays(gl.TRIANGLES, 0, shaders.tree.data.bufferInfo.numElements,);
    }



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

  trees = randomPointOnSphere(planetParams.numTrees, planetParams.radius);
  

  return {
    programInfo   : programInfo,
    vao           : planetVao,
    numElements   : planetNumElements,
  };
}


initNoise();
main();


// Structure for instancedDrawings
    // const matrices = [];
    // for (var i = 0; i < planetParams.numTrees; i++) matrices.push(m4.identity());
    // console.log(matrices);