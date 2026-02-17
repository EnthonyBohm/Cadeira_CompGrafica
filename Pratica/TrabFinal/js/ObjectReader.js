// -------------------- Parsers -----------------

function parseOBJ (text) {
    const objPositions   = [[0,0,0]];
    const objTexcoords  = [[0,0]];
    const objNormals    = [[0,0,0]];

    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
    ];

    let webglVertexData = [
        [],     // Pos
        [],     // Texc
        [],     // Norms
    ];

    const materialLibs = [];
    const geometries   = [];
    let   geometry;
    let   groups        = ['default'];
    let   material      = 'default';
    let   object        = 'default';

    const noop = () => {};

    function newGeometry () {
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    function setGeometry() {
        if (!geometry) {
            const a_position  = [];
            const a_texcoord  = [];
            const a_normal    = [];
            webglVertexData = [
                a_position,
                a_texcoord,
                a_normal  ,
            ];
            geometry = {
                object,
                groups,
                material,
                data: {
                    a_position,
                    a_texcoord,
                    a_normal,
                },
            };
            geometries.push(geometry);
        }
    }

    function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);

    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s:noop ,
    mtllib(parts, unparsedArgs){
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }
  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}

function parseMapArgs (unparsedArgs) {
    return unparsedArgs;
}

function parseMTL(text) {
    const materials = {};
    let material;

    const keywords = {
        newmtl(parts, unparsedArgs) {
            material = {};
            materials[unparsedArgs] = material;
        },
        /* eslint brace-style:0 */
        Ns(parts)     { material.shininess      = parseFloat(parts[0]); },
        Ka(parts)     { material.ambient        = parts.map(parseFloat); },
        Kd(parts)     { material.diffuse        = parts.map(parseFloat); },
        Ks(parts)     { material.specular       = parts.map(parseFloat); },
        Ke(parts)     { material.emissive       = parts.map(parseFloat); },
        Ni(parts)     { material.opticalDensity = parseFloat(parts[0]); },
        d(parts)      { material.opacity        = parseFloat(parts[0]); },
        illum(parts)  { material.illum          = parseInt(parts[0]); },
    };
    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
        continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
        continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    return materials;
}


// ---------------- Objects Structures --------------

async function createObjectData (gl, meshProgramInfo) {

    const objHref   = '../../ForestModels/Assets/obj/Tree_4_A_Color1.obj';
    const response  = await fetch(objHref);
    const text      = await response.text();
    const obj       = parseOBJ(text);
    const baseHref  = new URL(objHref, window.location.href);
    const matTexts  = await Promise.all(obj.materialLibs.map(async filename => {
      const matHref   = new URL (filename, baseHref).href;
      const response  = await fetch(matHref);
      return await response.text();
    }));
    const materials = parseMTL(matTexts.join('\n'));

    return obj.geometries.map(({material, data}) => {
      const bufferInfo  = twgl.createBufferInfoFromArrays(gl, data);
      const vao         = twgl.createVAOFromBufferInfo(gl, meshProgramInfo,  bufferInfo);
      return {
          material: materials[material],
          bufferInfo,
          vao,
      };
    });
}