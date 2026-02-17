#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
in vec3 a_normal;
in vec4 a_color;

uniform mat4    u_world;
uniform mat4    u_worldViewProjection;
uniform mat4    u_worldInverseTranspose;
uniform float   u_time;
uniform mat4    u_textureMatrix;

out vec2 v_texcoord;
out vec4 v_projectedTexcoord;
out vec3 v_normal;
out vec4 v_color;

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



    v_normal            =   mat3(u_worldInverseTranspose) * a_normal;
    v_projectedTexcoord =   u_textureMatrix * (u_world * a_position);
    v_texcoord          =   a_texcoord;
    v_color             =   a_color;

}