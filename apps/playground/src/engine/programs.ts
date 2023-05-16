import * as twgl from 'twgl.js';
import type {RenderType} from "./renderType";

type Program = {
  name: string;
  vertexShaderSource: string;
  fragmentShaderSource: string;
  bufferInfoArrays: twgl.Arrays;
  renderType: RenderType;
}

const spriteVertexShaderSource = `#version 300 es
in vec4 a_position;
in vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;


out vec2 v_texCoord;

void main() {
  gl_Position =  u_projection * u_view * u_model * a_position;
  v_texCoord = a_texCoord;
}
`;

const spriteFragmentShaderSource = `#version 300 es
precision mediump float;

uniform sampler2D u_texture;

in vec2 v_texCoord;

out vec4 outColor;

void main() {
  vec4 pixelColor = texture(u_texture, v_texCoord);
  outColor = pixelColor;
}
`;

const cameraVertexShaderSource = `#version 300 es
in vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_model;
uniform mat4 u_view;

uniform vec4 u_color;

out vec4 v_color;

void main() {
  gl_Position = u_projection * u_view * u_model * a_position;
  v_color = u_color;
}
`;

const cameraFragmentShaderSource = `#version 300 es
precision lowp float;
in vec4 v_color;
out vec4 outColor;

void main() {
    outColor = v_color;
}
`;

export const programs: Program[] = [
  {
    name: 'sprite',
    vertexShaderSource: spriteVertexShaderSource,
    fragmentShaderSource: spriteFragmentShaderSource,
    bufferInfoArrays: {
      a_position: {
        numComponents: 3,
        data: [
          -0.5, -0.5, 0.0,
          -0.5, 0.5, 0.0,
          0.5, -0.5, 0.0,
          0.5, 0.5, 0.0,
        ],
      },
      a_texCoord: {
        numComponents: 2,
        data: [
          0.0, 0.0,
          0.0, 1.0,
          1.0, 0.0,
          1.0, 1.0,
        ]
      },
      indices: [0, 1, 2, 2, 1, 3],
    },
    renderType: 'triangle_strip'
  },
  {
    name: 'camera',
    vertexShaderSource: cameraVertexShaderSource,
    fragmentShaderSource: cameraFragmentShaderSource,
    bufferInfoArrays: {
      a_position: {
        numComponents: 3,
        data: [
          -0.5, -0.5, 0.0,
          -0.5, 0.5, 0.0,
          0.5, -0.5, 0.0,
          0.5, 0.5, 0.0,
        ],
      },
      indices: [0, 1, 1, 3, 3, 2, 2, 0],
    },
    renderType: 'lines'
  }
];
