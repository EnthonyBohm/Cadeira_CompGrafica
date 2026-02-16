
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

    const vs = await loadShader("../shaders/vertex.glsl");
    const fs = await loadShader("../shaders/fragment.glsl");
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
        const bufferInfo  = twgl.createBufferInfoFromArrays(gl, data);
        const vao         = twgl.createVAOFromBufferInfo(gl, meshProgramInfo,  bufferInfo);
        return {
            material: materials[material],
            bufferInfo,
            vao,
        };
    });


    const cameraTarget = [0, 0, 0];
    // figure out how far away to move the camera so we can likely
    // see the object.
    const cameraPosition = [0, 0, 4];
    // Set zNear and zFar to something hopefully appropriate
    // for the size of this object.
    const zNear = 0.1;
    const zFar = 50;

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