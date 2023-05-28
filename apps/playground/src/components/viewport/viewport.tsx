import React, {FC, useLayoutEffect, useRef} from 'react';
import * as twgl from 'twgl.js';
import {engine} from "../../engine/engine";
import {programs} from "../../engine/programs";
import {useKeybinding} from "../../hooks/use-keybinding.hook";

function createOrthographicProjectionMatrix(width: number, height: number) {
  const aspectRatio = width / height;

  console.log(aspectRatio, width, height);

  const left = -width / 2;
  const right = width / 2;
  const top = height / 2;
  const bottom = -height / 2;
  const near = -1;
  const far = 1;

  return twgl.m4.ortho(left, right, bottom, top, near, far);
}

type IProps = {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
};

export const Viewport: FC<IProps> = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const deltaStartTime = useRef(0);
  const startTime = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // Cursor coordinates
    const x = e.clientX;
    const y = e.clientY;

    // Canvas coordinates
    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    // Normalized to (0, 0) in the center
    const normalizedX = 1 * (canvasX - rect.width / 2) * engine.state().scale;
    const normalizedY = -1 * (canvasY - rect.height / 2) * engine.state().scale;

    console.log(normalizedX, normalizedY);
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    /**/
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    /**/
  }

  useKeybinding(' ', () => {
    engine.setIsPlaying(!engine.isPlaying.getValue());
  });

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl2");

    if (!gl) {
      return;
    }

    engine.setGl(gl);

    programs.forEach(({name, vertexShaderSource, fragmentShaderSource, bufferInfoArrays, renderType}) => {
      engine.addProgram(name, vertexShaderSource, fragmentShaderSource, bufferInfoArrays, renderType);
    });

    return () => {
      engine.programs.forEach(({program, bufferInfo}) => {
        gl.deleteProgram(program.program);

        if (bufferInfo.attribs) {
          Object.values(bufferInfo.attribs).forEach((attrib) => {
            gl.deleteBuffer(attrib.buffer);
          });
        }

        if (bufferInfo.indices) {
          gl.deleteBuffer(bufferInfo.indices);
        }
      });

      // Clean up textures for all objects
      engine.state().sortedSprites.forEach((sprite) => {
        if (sprite.texture) {
          gl.deleteTexture(sprite.texture);
        }
      });
    }
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl2");

    if (!gl) {
      return;
    }

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    console.log(canvas.parentElement);

    const canvasContainer = canvas.parentElement!;

    canvas.width = canvasContainer.clientWidth * window.devicePixelRatio;
    canvas.height = canvasContainer.clientHeight * window.devicePixelRatio;

    canvas.style.width = `${canvasContainer.clientWidth}px`;
    canvas.style.height = `${canvasContainer.clientHeight}px`;

    const spriteProgram = engine.programs.get('sprite');
    const cameraProgram = engine.programs.get('camera');

    if (!spriteProgram || !cameraProgram) {
      return;
    }

    let animationFrameId: number;

    const projectionMatrix = createOrthographicProjectionMatrix(gl.canvas.width, gl.canvas.height);

    function render(time: number) {
      const currentFrame = engine.state().currentFrame;

      const playing = engine.isPlaying.getValue();
      const lastPlaying = engine.lastIsPlaying.getValue();

      if (playing && !lastPlaying) {
        startTime.current = time - (currentFrame + 1) * 1000 / engine.state().fps;
        engine.setLastIsPlaying(true);
      }

      if (playing) {
        deltaStartTime.current = time - startTime.current;
      }

      if (!gl || !canvas || !spriteProgram || !cameraProgram) {
        return;
      }


      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.clearColor(0.18, 0.18, 0.18, 1);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

      twgl.setBuffersAndAttributes(gl, spriteProgram.program, spriteProgram.bufferInfo);

      const scale = engine.state().scale;

      // viewMatrix is camera position. We want to move the camera in the opposite direction of the model when translating
      let viewMatrix = twgl.m4.translate(twgl.m4.identity(), [0, 0, 0].map(v => -v));
      // We want to implement a camera that can pan and zoom. Zooming is done by scaling the view matrix
      viewMatrix = twgl.m4.scale(viewMatrix, [scale, scale, 1].map(v => 1 / v));

      gl.useProgram(spriteProgram.program.program);

      /**
       * Render sprites
       */
      engine.state().sortedSprites.forEach((sprite, i) => {
        if (!sprite.texture) {
          return;
        }

        const spriteState = engine.nextSpritesParams.getValue()[sprite.id];

        if (!spriteState) {
          return;
        }

        const [x, y] = spriteState.position;
        const rotation = spriteState.rotation;
        const [width, height] = spriteState.scale;
        const rotInRad = rotation * Math.PI / 180;

        const modelMatrix = twgl.m4.identity();
        twgl.m4.translate(twgl.m4.identity(), [x * devicePixelRatio, y * devicePixelRatio, i * 0.0001], modelMatrix);
        twgl.m4.scale(modelMatrix, [width, height, 0], modelMatrix);
        twgl.m4.rotateZ(modelMatrix, rotInRad, modelMatrix);

        twgl.setUniforms(spriteProgram.program, {
          u_texture: sprite.texture,
          u_model: modelMatrix,
          u_view: viewMatrix,
          u_projection: projectionMatrix,
        });

        twgl.drawBufferInfo(gl, spriteProgram.bufferInfo, spriteProgram.renderType);
      });

      gl.clear(gl.DEPTH_BUFFER_BIT);

      /**
       * Render camera as a rectangle
       */
      gl.useProgram(cameraProgram.program.program);
      twgl.setBuffersAndAttributes(gl, cameraProgram.program, cameraProgram.bufferInfo);

      const camera = engine.state().camera;

      twgl.setUniforms(cameraProgram.program, {
        u_projection: projectionMatrix,
        u_model: twgl.m4.scale(twgl.m4.translate(twgl.m4.identity(), [camera.x * devicePixelRatio, camera.y * devicePixelRatio, 0]), [camera.width, camera.height, 0]),
        u_view: viewMatrix,
        u_color: [0, 1, 0, 1],
      });

      twgl.drawBufferInfo(gl, cameraProgram.bufferInfo, cameraProgram.renderType);

      if (devicePixelRatio > 1) {
        twgl.setUniforms(cameraProgram.program, {
          u_projection: projectionMatrix,
          u_model: twgl.m4.scale(twgl.m4.translate(twgl.m4.identity(), [camera.x * devicePixelRatio + 1, camera.y * devicePixelRatio + 1, 0]), [camera.width - 2, camera.height - 2, 0]),
          u_view: viewMatrix,
          u_color: [0, 1, 0, 1],
        });

        twgl.drawBufferInfo(gl, cameraProgram.bufferInfo, cameraProgram.renderType);
      }

      /**
       * Render selected sprites box as a rectangle
       */

      engine.state().sortedSprites.forEach((sprite) => {

        if (!engine.state().selectedSpriteIds.includes(sprite.id)) {
          return;
        }

        const spriteState = engine.nextSpritesParams.getValue()[sprite.id];

        if (!spriteState) {
          return;
        }

        const [x, y, z] = spriteState.position;
        const rotation = spriteState.rotation;
        const [width, height] = spriteState.scale;

        const rotInRad = rotation * Math.PI / 180;
        const modelMatrix = twgl.m4.identity();
        twgl.m4.translate(twgl.m4.identity(), [x * devicePixelRatio, y * devicePixelRatio, z], modelMatrix);
        twgl.m4.scale(modelMatrix, [width, height, 0], modelMatrix);
        twgl.m4.rotateZ(modelMatrix, rotInRad, modelMatrix);

        twgl.setUniforms(cameraProgram.program, {
          u_projection: projectionMatrix,
          u_model: modelMatrix,
          u_view: viewMatrix,
          u_color: [0, 0, 1, 1],
        });

        twgl.drawBufferInfo(gl, cameraProgram.bufferInfo, cameraProgram.renderType);

        // if (devicePixelRatio > 1) {
        //   twgl.setUniforms(cameraProgram.program, {
        //     u_projection: projectionMatrix,
        //     u_model: twgl.m4.scale(twgl.m4.translate(twgl.m4.identity(), [x * devicePixelRatio + 1, y * devicePixelRatio + 1, z]), [sprite.width - 2, sprite.height - 2, 0]),
        //     u_view: viewMatrix,
        //     u_color: [0, 0, 1, 1],
        //   });
        //
        //   twgl.drawBufferInfo(gl, cameraProgram.bufferInfo, cameraProgram.renderType);
        // }
      });

      gl.lineWidth(1);

      /**
       * Increment frame if playing. Get current frame based on time and fps. Always start from 0
       */
      if (playing) {
        const frame = Math.floor((deltaStartTime.current) / (1000 / engine.state().fps)) % engine.state().lengthInFrames;

        // If frame is the same as the current frame, don't update it
        // TODO: Double buffering please
        if (frame !== currentFrame) {
          engine.calculateNextSpritesParams(frame);
          engine.setCurrentFrame(frame);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas ref={canvasRef}/>
    </div>
  );
}
