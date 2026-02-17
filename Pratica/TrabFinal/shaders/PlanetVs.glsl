#version 300 es

in vec4   a_position;
in vec2   a_texcoord;
in vec3   a_normal;
in float  a_elevation;

uniform mat4 u_world;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;
uniform mat4 u_textureMatrix;

flat out vec3  v_normal;
out float v_elevation;
out vec2  v_texcoord;
out vec4  v_projectedTexcoord;


void main() {
  gl_Position               = u_worldViewProjection * a_position;
  vec3 surfaceWorldPosition = (u_world * a_position).xyz;


  v_projectedTexcoord   = u_textureMatrix * (u_world * a_position);
  v_texcoord            = a_texcoord;
  v_elevation           = a_elevation;
  v_normal              = mat3(u_worldInverseTranspose) * a_normal;
}