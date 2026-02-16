#version 300 es

in vec4   a_position;
in vec3   a_normal;
in float  a_elevation;

uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

uniform mat4 u_world;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

flat out vec3  v_normal;
out vec3  v_surfaceToLight;
out float v_elevation;


void main() {
  gl_Position = u_worldViewProjection * a_position;
  v_elevation = a_elevation;
  v_normal = mat3(u_worldInverseTranspose) * a_normal;

  vec3 surfaceWorldPosition = (u_world * a_position).xyz;

  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
}