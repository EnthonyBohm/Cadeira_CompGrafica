
async function loadShader (url) {
    const response = await fetch(url);
    return await response.text();
}

async function main () {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }

    twgl.setAttributePrefix("a_");

    const vs = await loadShader("vertex.glsl");
    const fs = await loadShader("fragment.glsl");
    const meshProgramInfo = twgl.createProgramInfo (gl, [vs,fs]);

    // const objHref   = '../../ForestModels/Assets/obj/Tree_4_A_Color1.obj';
    const objHref   = '../../ForestModels/Assets/obj/Rock_3_C_Color1.obj';
    // const objHref   = '../../WebGl2Fundamentals/webgl/resources/models/chair/chair.obj'
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

    const parts = obj.geometries.map(({material, data}) => {
      if (data.color) {
        if (data.position.length === data.color.length) {
          data.color = {numComponents:3, data: data,color};
        }
      } else {
        data.color = { value:[1,1,1,1] };
      }

      const bufferInfo  = twgl.createBufferInfoFromArrays(gl, data);
      const vao         = twgl.createVAOFromBufferInfo(gl, meshProgramInfo,  bufferInfo);
      return {
          material: materials[material],
          bufferInfo,
          vao,
      };
    });

    function getExtents(positions) {
        const min = positions.slice(0, 3);
        const max = positions.slice(0, 3);
        for (let i = 3; i < positions.length; i += 3) {
        for (let j = 0; j < 3; ++j) {
            const v = positions[i + j];
            min[j] = Math.min(v, min[j]);
            max[j] = Math.max(v, max[j]);
        }
        }
        return {min, max};
    }

    function getGeometriesExtents(geometries) {
        return geometries.reduce(({min, max}, {data}) => {
        const minMax = getExtents(data.position);
        return {
            min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
            max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
        };
        }, {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
        });
    }

    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    // amount to move the object so its center is at the origin
    const objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);
    const cameraTarget = [0, 0, 0];
    // figure out how far away to move the camera so we can likely
    // see the object.
    const radius = m4.length(range) * 1.2;
    const cameraPosition = m4.addVectors(cameraTarget, [
        0,
        0,
        radius,
    ]);
    // Set zNear and zFar to something hopefully appropriate
    // for the size of this object.
    const zNear = radius / 100;
    const zFar = radius * 3;

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    function render(time) {
        time *= 0.001;

        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        
        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        const up = [0, 1, 0];
        // Compute the camera's matrix using look at.
        const camera = m4.lookAt(cameraPosition, cameraTarget, up);

        // Make a view matrix from the camera matrix.
        const view = m4.inverse(camera);

        const sharedUniforms = {
            u_lightDirection: m4.normalize([-12, 3, 5]),
            u_view: view,
            u_projection: projection,
            u_viewWorldPosition: cameraPosition
        }

        gl.useProgram(meshProgramInfo.program);

        twgl.setUniforms(meshProgramInfo, sharedUniforms);
        let u_world = m4.yRotation(time);
        u_world = m4.translate(u_world, ...objOffset);

        for (const {bufferInfo, vao, material} of parts) {
            gl.bindVertexArray(vao);

            twgl.setUniforms(meshProgramInfo, {
                u_world,
            }, material);
            twgl.drawBufferInfo(gl, bufferInfo);
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();