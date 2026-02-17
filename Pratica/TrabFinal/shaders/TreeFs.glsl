#version 300 es
precision highp float;

in      vec2        v_texcoord;
in      vec3        v_normal;
in      vec3        v_surfaceToLight;
in      vec4        v_color;

uniform vec3        diffuse;
uniform vec3        ambient;
uniform vec3        emissive;
uniform vec3        specular;
uniform float       shininess;
uniform float       opacity;
uniform vec3        u_lightDirection;
uniform vec3        u_ambientLight;
uniform sampler2D   u_texture;

out     vec4        outColor;

void main () {
vec3 normal = normalize(v_normal);

vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
vec4 texColor = texture(u_texture, v_texcoord);

float light = max (dot (normal, surfaceToLightDirection), 0.3);

vec3 effectiveDiffuse = diffuse.rgb * v_color.rgb;
float effectiveOpacity = v_color.a * opacity;

vec3 albedo = texColor.rgb;

vec3 color =
    emissive +
    ambient * u_ambientLight +
    albedo * diffuse * light;

outColor = vec4(color, texColor.a * opacity);
}