#version 300 es

precision highp float;

flat in vec3 v_normal;
in vec3 v_surfaceToLight;
in float v_elevation;

uniform vec4 u_color;
uniform vec3 u_reverseLightDirection;

out vec4 outColor;

void main() {
  vec3 normal = normalize(v_normal);
  // Ajuste a direção da luz - use valores mais razoáveis
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

  float light       = max ( dot (normal, surfaceToLightDirection), 0.3);

  

  // Cores base
  vec3 deepWaterColor = vec3(0.05, 0.15, 0.3);
  vec3 shallowWaterColor = vec3(0.05, 0.15, 0.4);
  vec3 sandColor = vec3(0.8, 0.7, 0.5);
  vec3 grassColor = vec3(0.2, 0.5, 0.1);
  vec3 mountainColor = vec3(0.4, 0.35, 0.3);
  vec3 snowColor = vec3(0.9, 0.9, 1.0);

  // Cores de luz

  vec3 finalColor;

  if      (v_elevation < -0.4)  { finalColor = deepWaterColor;}
  else if (v_elevation < -0.21) { finalColor = shallowWaterColor;}
  else if (v_elevation < -0.19) { finalColor = sandColor; }
  else if (v_elevation < 0.22){ finalColor = grassColor; }
  else { finalColor = mountainColor;}

  outColor = vec4(finalColor * light, 1) ;
}