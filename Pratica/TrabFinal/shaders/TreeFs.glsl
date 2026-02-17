#version 300 es
precision highp float;

in      vec2        v_texcoord;
in      vec4        v_projectedTexcoord;
in      vec3        v_normal;
in      vec4        v_color;

uniform vec3        diffuse;
uniform vec3        ambient;
uniform vec3        emissive;
uniform vec3        specular;
uniform float       shininess;
uniform float       opacity;
uniform vec3        u_ambientLight;
uniform sampler2D   u_texture;
uniform sampler2D   u_projectedTexture;
uniform float       u_bias;
uniform vec3        u_reverseLightDirection;

out     vec4        outColor;

void main () {
vec3 normal = normalize(v_normal);
float light = max (dot (normal, u_reverseLightDirection), 0.3);

vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
float currentDepth = projectedTexcoord.z + u_bias;

bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

vec4 texColor = texture(u_texture, v_texcoord);


vec3 albedo = texColor.rgb;

vec3 color =
    emissive +
    ambient * u_ambientLight +
    albedo * diffuse * light * shadowLight;

outColor = vec4(color, texColor.a * opacity);
}