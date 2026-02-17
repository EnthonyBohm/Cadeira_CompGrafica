
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
      var displacement = getDisplacementAtpoint(nx, ny, nz, 3.0, roughness, seed);
      
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

function getDisplacementAtpoint (nx, ny, nz, frequency, roughness, seed){
  var noise = simpleNoise(nx * frequency, ny * frequency, nz * frequency, seed);

  amplitude = 1.0;
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
  
  return noise * roughness;
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


// ================= Object Setters ==================
function randomPointOnSphere (numTrees ,radius) {
  function getPoints(radius){
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
  
    return [
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    ];
  }
  let points = []
  for (var i = 0; i<numTrees; i++) {
    var point = getPoints(planetParams.radius);
    points.push(point);
  }
  return points

}
