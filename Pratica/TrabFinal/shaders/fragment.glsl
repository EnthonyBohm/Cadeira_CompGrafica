#version 300 es
precision highp float;

in          vec2        v_texcoord;
in          vec3        v_normal;
in          vec3        v_surfaceToView;
in          vec4        v_color;

uniform     vec3        diffuse;
uniform     vec3        ambient;
uniform     vec3        emissive;
uniform     vec3        specular;
uniform     float       shininess;
uniform     float       opacity;
uniform     vec3        u_lightDirection;
uniform     vec3        u_ambientLight;
uniform     sampler2D   u_texture;

out         vec4        outColor;

void main () {
vec3 normal = normalize(v_normal);

vec3 surfaceToViewDirection = normalize(v_surfaceToView);

vec4 texColor = texture(u_texture, v_texcoord);
vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);


float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

vec3 effectiveDiffuse = diffuse.rgb * v_color.rgb;
float effectiveOpacity = v_color.a * opacity;

outColor = vec4(
        v_texcoord.x,  // Vermelho = U
        v_texcoord.y,  // Verde = V
        1.0 - v_texcoord.x, // Azul = inverso de U
        1.0
    );

outColor = texColor;

//outColor = texColor * vec4(
//    emissive +
//    ambient * u_ambientLight +
//    effectiveDiffuse * fakeLight +
//    specular * pow(specularLight, shininess),
 //   effectiveOpacity);

}