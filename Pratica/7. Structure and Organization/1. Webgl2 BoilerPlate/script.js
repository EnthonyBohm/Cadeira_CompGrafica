

function compileShader (gl, shaderSource, shaderType) {
    // Cria o objeto Shader
    var shader = gl.createShader (shaderType);

    // Define a origem do Shader
    gl.shaderSource(shader, shaderSource);

    // Compila o Shader
    gl.compileShader(shader);

    // Verifica a integridade da operação
    var success = gl.getShaderParameter (shader, gl.COMPILE_STATUS);
    if (!success) {
        throw ("Could not compile shader:" + gl.getShaderInfoLog(shader));
    }

    return shader;
}

function createProgram (gl, vertexShader, fragmentShader) {
    // Cria programa
    var program = gl.createProgram();

    // Junta os Shaders
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // Linka o programa
    gl.linkProgram(program);

    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        throw ("Program Failed to Link:" + gl.getProgramInfoLog(program));
    }

    return program;
}