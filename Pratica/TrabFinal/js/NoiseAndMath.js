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

function normalize (positions) {
  const len = Math.sqrt(positions[0] ** 2 + positions[1] ** 2 +positions[2] ** 2 );
  return [
    positions[0] / len,
    positions[1] / len,
    positions[2] / len,
  ];
}