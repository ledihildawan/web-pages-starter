/* GLSL Vertex Shader */
#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aTexCoord;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
