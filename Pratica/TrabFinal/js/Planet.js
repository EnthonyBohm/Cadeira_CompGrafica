const planetParams = {
    radius: 8.0,
    subdivisions: 4,
    roughness: 1,
    rotationSpeed: 0.2,
    seed: Math.random() * 10000,
    numTrees: 400,
    treeSize: 0.8,
    moveSun: false,
};

const programOptions = {
  attribLocations: {
    "a_position" : 0,
    "a_normal"   : 1,
    "a_elevation": 2,
    "a_color"    : 3,
    "a_texcoord" : 4,
  }
}


var globalUniforms = {
  u_lightWorldPosition: [20, 0, 20],
  }

var PlanetUniforms = {
  u_world: m4.identity(),
  u_worldViewProjection: m4.identity(),
  u_worldInverseTranspose: m4.identity(),
};

var trees = [];

async function main() {
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  const planetProgramInfo   = await createProgramInfo(gl,"./shaders/PlanetVs.glsl", "./shaders/PlanetFs.glsl");  
  const meshProgramInfo     = await createProgramInfo (gl, "./shaders/TreeVs.glsl", "./shaders/TreeFs.glsl");
  const depthProgramInfo    = await createProgramInfo (gl, "./shaders/DepthVs.glsl", "./shaders/DepthFs.glsl");

  
  const shaders = {
    planet : initializePlanet(gl, planetProgramInfo), // programInfo, Vao, NumElements
    tree   : {programInfo: meshProgramInfo ,
              data: (await createObjectData(gl, meshProgramInfo)).at(0)}, // Material, bufferInfo, vao
  };
  
  setMenu(gl, shaders, canvas);

// ====================== Setting Important Info =====================
  const depthTexture = gl.createTexture();
  const depthTextureSize = 512;
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.texImage2D(
      gl.TEXTURE_2D,      // target
      0,                  // mip level
      gl.DEPTH_COMPONENT32F, // internal format
      depthTextureSize,   // width
      depthTextureSize,   // height
      0,                  // border
      gl.DEPTH_COMPONENT, // format
      gl.FLOAT,           // type
      null);              // data
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const depthFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
  gl.framebufferTexture2D(
      gl.FRAMEBUFFER,       // target
      gl.DEPTH_ATTACHMENT,  // attachment point
      gl.TEXTURE_2D,        // texture target
      depthTexture,         // texture
      0);                   // mip level
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer incompleto");
  }


  var translation = [0, 0, -10];
  var rotation = [0, 0, 0];
  var fieldOfViewRadians = degToRad(60);
  
  
  const treeTexture = twgl.createTexture(gl, {
        src: '../../ForestModels/Assets/obj/forest_texture.png',
        flipY:true,
    });
  // var treeSharedUniforms = {
  //     u_texture: treeTexture,
  //   };

  var fRotationRadians = 0;
  var then = 0;


  
  //  Computa a camera
  var camera = [0, 0, 10]
  var target = [0, 0, 0];
  var up     = [0, 1, 0];

  

  addMouseInteraction(canvas, rotation);

  

  function drawScene(now, projectionMatrix, cameraMatrix, textureMatrix, lightWorldMatrix, programInfo) {
    const viewMatrix            = m4.inverse(cameraMatrix);
    var viewProjectionMatrix  = m4.multiply(projectionMatrix, viewMatrix);
    var planetProgramInfo;
    var treeProgramInfo;

    if (Array.isArray(programInfo)){
      planetProgramInfo = programInfo[0];
      treeProgramInfo = programInfo[1];
    } else {
      planetProgramInfo = programInfo;
      treeProgramInfo = programInfo;
    }

  // ========= Rotação do Planeta =====
    now *= 0.001;
    var deltaTime = now - then;
    then = now;

  // ========== Rotação do Sol ===========
  if (planetParams.moveSun){
    var orbitRadius = 100.0;
    var sunSpeed    = 0.5;
    
    globalUniforms.u_lightWorldPosition = [
      Math.sin(now * sunSpeed) * orbitRadius,
      Math.sin(now * 0.1) * 20.0,
      Math.cos(now * sunSpeed) * orbitRadius
    ];
  }


// ===================== Desenhando o Planeta ====================
    gl.useProgram(planetProgramInfo.program);
    gl.bindVertexArray(shaders.planet.vao);
    twgl.setUniforms(planetProgramInfo, {
      u_bias: 0.005,
      u_textureMatrix: textureMatrix,
      u_projectedTexture: depthTexture,
      u_reverseLightDirection: m4.normalize(lightWorldMatrix.slice(8,11)),
    });
  
    fRotationRadians += planetParams.rotationSpeed * deltaTime;
  
    var worldMatrix = m4.identity();
    m4.translate (worldMatrix, translation[0], translation[1], translation[2],worldMatrix );
    m4.xRotate (worldMatrix, rotation[0], worldMatrix);
    m4.yRotate (worldMatrix, rotation[1], worldMatrix);
    m4.zRotate (worldMatrix, rotation[2], worldMatrix);  
    PlanetUniforms.u_world                  =   worldMatrix;
    PlanetUniforms.u_worldViewProjection    =   m4.multiply  (viewProjectionMatrix, worldMatrix);
    PlanetUniforms.u_worldInverseTranspose  =   m4.transpose (m4.inverse (worldMatrix));
    
    twgl.setUniforms(planetProgramInfo, PlanetUniforms);
    twgl.setUniforms(planetProgramInfo, globalUniforms);
    
    
    gl.drawElements(gl.TRIANGLES, shaders.planet.numElements, gl.UNSIGNED_SHORT, 0);
    
// ===================== Desenhando as Árvores ====================
    gl.useProgram(treeProgramInfo.program);
    gl.bindVertexArray(shaders.tree.data.vao);
    
    twgl.setUniforms(treeProgramInfo, {
      u_texture: treeTexture,
      u_bias: -0.006,
      u_textureMatrix: textureMatrix,
      u_projectedTexture: depthTexture,
      u_reverseLightDirection: m4.normalize(lightWorldMatrix.slice(8,11)),
    });
    console.log(trees.length);
     
    for (let point of trees) {
      const normals = m4.normalize(point);
      var displacement = getDisplacementAtpoint(
        normals[0], 
        normals[1],
        normals[2],
        3.0,
        planetParams.roughness,
        planetParams.seed );
      var finalRadius = planetParams.radius + displacement;
      var position = [
        normals[0] * finalRadius,
        normals[1] * finalRadius,
        normals[2] * finalRadius,
      ];
      var axis = m4.cross(up, normals);
      var dotProduct = m4.dot(up, normals)
      var angle = Math.acos(dotProduct);


      var scale = planetParams.radius * 0.025 * planetParams.treeSize;
      var scaleMatrix = m4.scaling(scale, scale, scale);
    
      var rotationMatrix = m4.axisRotation(axis, angle);
      
      var localTreeMatrix = m4.identity();    // Sem transformar para o planeta
      m4.translate(localTreeMatrix, position[0], position[1], position[2], localTreeMatrix);
      m4.multiply(localTreeMatrix, rotationMatrix, localTreeMatrix);
      m4.multiply(localTreeMatrix, scaleMatrix, localTreeMatrix);

      worldMatrix = m4.multiply(PlanetUniforms.u_world, localTreeMatrix);
      var worldViewProjection   = m4.multiply(viewProjectionMatrix, worldMatrix);
      var worldInverseTranspose = m4.transpose(m4.inverse(worldMatrix));

      twgl.setUniforms(treeProgramInfo, {
        u_world: worldMatrix,
        u_worldViewProjection: worldViewProjection,
        u_worldInverseTranspose: worldInverseTranspose,
        u_texture: treeTexture,
        u_time : now,
      }, globalUniforms, shaders.tree.data.material);      

      gl.drawArrays(gl.TRIANGLES, 0, shaders.tree.data.bufferInfo.numElements,);
    }

    }

  function render (now) {
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    const lightWorldMatrix = m4.lookAt(
      globalUniforms.u_lightWorldPosition,
      target,
      up,
    );

    size = 7.3;
    const lightProjectionMatrix = m4.orthographic(
    -size, size,
    -size, size,
    1,
    300
);

  // Desenha a textura de profundidade
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.viewport(0, 0, depthTextureSize, depthTextureSize);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawScene(now,
      lightProjectionMatrix,
      lightWorldMatrix,
      m4.identity(),
      lightWorldMatrix,
      depthProgramInfo);

  // Agora desenha a projeção
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let textureMatrix = m4.identity();
    m4.translate(textureMatrix, 0.5, 0.5, 0.5, textureMatrix);
    m4.scale(textureMatrix, 0.5, 0.5, 0.5, textureMatrix);
    m4.multiply(textureMatrix, lightProjectionMatrix, textureMatrix);
  // Inversa resulta em matriz que transforma outras a srem relativas a esse espaço de mundo
    m4.multiply(
          textureMatrix,
          m4.inverse(lightWorldMatrix), 
          textureMatrix);
    
  // Computa o Frustrum inicial e a projeção
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    const cameraMatrix = m4.lookAt(camera, target, up);

    drawScene(now,
      projectionMatrix,
      cameraMatrix,
      textureMatrix,
      lightWorldMatrix,
      [shaders.planet.programInfo, shaders.tree.programInfo]);


      requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
}


async function loadShader (url) { 
    const response = await fetch(url);        // Fetch é feito em relação à pasta raiz Trab e não ao Planet.js.
    return await response.text();
}

async function createProgramInfo (gl, vertexSource, fragmentSource) {
  const vertexShader    =   await loadShader (vertexSource);   
  const fragmentShader  =   await loadShader (fragmentSource);
  return twgl.createProgramInfo (gl, [vertexShader, fragmentShader], programOptions);

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