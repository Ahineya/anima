import * as twgl from 'twgl.js';
import type {RenderType} from "./renderType";

type Program = {
  name: string;
  vertexShaderSource: string;
  fragmentShaderSource: string;
  bufferInfoArrays: twgl.Arrays;
  renderType: RenderType;
}

const spriteVertexShaderSource = `
attribute vec4 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

varying vec2 v_texCoord;

void main() {
  gl_Position =  u_projection * u_view * u_model * a_position;
  v_texCoord = a_texCoord;
}
`;

const spriteFragmentShaderSource = `
precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texCoord;

void main() {
  vec4 pixelColor = texture2D(u_texture, v_texCoord);
  gl_FragColor = pixelColor;
}
`;

const cameraVertexShaderSource = `
attribute vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_model;
uniform mat4 u_view;

void main() {
  gl_Position = u_projection * u_view * u_model * a_position;
}
`;

const cameraFragmentShaderSource = `
void main() {
    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
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
