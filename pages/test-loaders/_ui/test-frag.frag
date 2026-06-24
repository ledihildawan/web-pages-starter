/* Fragment Shader Alternative Extension */
#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform vec3 uColor;

void main() {
    fragColor = vec4(uColor * vTexCoord.y, 1.0);
}
