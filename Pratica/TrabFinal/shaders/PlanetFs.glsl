#version 300 es

precision highp float;

in      float   v_elevation;
flat in vec3    v_normal;
in      vec2    v_texcoord;
in      vec4    v_projectedTexcoord;

uniform vec4        u_colorMult;
uniform sampler2D   u_texture;
uniform sampler2D   u_projectedTexture;
uniform float       u_bias;
uniform vec3        u_reverseLightDirection;

out vec4 outColor;

void main() {
  vec3 normal = normalize(v_normal);

float diffuse = max(dot(normal, u_reverseLightDirection), 0.0);  float ambient = 0.2; // Luz constante
  float totalLight = diffuse + ambient;

  float bias = -0.001;
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + bias;

  bool inRange = 
    projectedTexcoord.x >= 0.0 &&
    projectedTexcoord.x <= 1.0 &&
    projectedTexcoord.y >= 0.0 &&
    projectedTexcoord.y <= 1.0;

  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight    = 1.0 ;
  if (inRange && projectedDepth <= currentDepth){
      shadowLight = 0.0;
  }

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

  vec4 texColor = texture (u_texture, v_texcoord);

  outColor = vec4(
    finalColor * totalLight * shadowLight ,
    texColor.a
  ) ;


}