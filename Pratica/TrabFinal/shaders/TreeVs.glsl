#version 300 es
in vec4 a_position;
in vec3 a_normal;
in vec4 a_color;
in vec2 a_texcoord;

uniform mat4 u_world;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;
uniform vec3 u_lightWorldPosition;
uniform float u_time;

out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec4 v_color;
out vec2 v_texcoord;

void main() {
    vec4    position    = a_position;
    if (position.y > 2.4){
        float   speed       = u_time * 2.0;
        float   noise       = sin(speed + (u_world[3].x * 0.5) + (u_world[3].z * 0.5));

        float   displacement = noise * 0.1 * a_position.y;

        position.x += displacement;
        position.z += displacement;        
    }



    gl_Position = u_worldViewProjection * position;
    v_normal = mat3(u_worldInverseTranspose) * a_normal;
    v_color = a_color;
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    
    v_texcoord = a_texcoord;

}