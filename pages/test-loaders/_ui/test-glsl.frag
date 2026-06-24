/* GLSL Fragment Shader */
#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform float u_time;

void main() {
    vec2 uv = vTexCoord;
    vec3 col = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
