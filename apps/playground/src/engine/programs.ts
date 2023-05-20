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

const timelineGridVertexShaderSource = `#version 300 es
in vec4 a_position;

uniform mat4 u_model;

void main() {
  gl_Position = u_model * a_position;
}
`;

const timelineGridFragmentShaderSource = `#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_ratio; // Device pixel ratio
uniform vec2 u_gridSize;

uniform int u_rows;
uniform int u_columns;

uniform int u_selectedColumn;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  // Calculate the position of this fragment in pixels.

  vec2 pixelPosition = vec2(gl_FragCoord.x, gl_FragCoord.y);

  vec2 gridSize = vec2(u_gridSize.x * u_ratio, u_gridSize.y * u_ratio);

  pixelPosition.y = u_resolution.y - pixelPosition.y;

  // Calculate the grid cell this pixel is in.
  vec2 gridPosition = mod(pixelPosition, gridSize);

  // If the pixel is on a grid line (within a 1-pixel margin) then draw a line.
  float margin = 1.0;
  if (gridPosition.y < margin || gridPosition.y > gridSize.y - margin) {

    if (pixelPosition.y > float(u_rows) * gridSize.y + 1.0) {
       discard;
    }

    if (pixelPosition.x > float(u_columns) * gridSize.x + 1.0) {
        discard;
    }

      outColor = u_color;
  }

  if (gridPosition.x < margin || gridPosition.x > gridSize.x - margin) {
    if (pixelPosition.y > float(u_rows) * gridSize.y + 1.0) {
       discard;
    }

    if (pixelPosition.x > float(u_columns) * gridSize.x + 1.0) {
        discard;
    }

    if (int(pixelPosition.x / gridSize.x) == u_selectedColumn) {
        outColor = vec4(0.8, 0.8, 0.8, 1.0);
    } else {
      outColor = u_color;
    }
  }
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
  },
  {
    name: 'timeline-grid',
    vertexShaderSource: timelineGridVertexShaderSource,
    fragmentShaderSource: timelineGridFragmentShaderSource,
    bufferInfoArrays: {
      a_position: {
        numComponents: 3,
        data: [
          -1, -1, 0.0,
          -1, 1, 0.0,
          1, -1, 0.0,
          1, 1, 0.0,
        ],
      },
      indices: [0, 1, 2, 2, 1, 3],
    },
    renderType: 'triangle_strip'
  },
];
