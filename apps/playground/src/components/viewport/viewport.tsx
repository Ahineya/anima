import React, {FC, useLayoutEffect, useRef} from 'react';
import * as twgl from 'twgl.js';
import {useStoreSubscribe} from "@anima/use-store-subscribe";
import {sceneStore} from "../../stores/scene.store";
import {programs} from "../../engine/programs";
import {useKeybinding} from "../../hooks/use-keybinding.hook";
import {sortByOrder} from "../../helpers/sort-by-order.helper";

const fps = 30;
const framesLength = 5 * fps;

function createOrthographicProjectionMatrix(width: number, height: number) {
  const aspectRatio = width / height;

  const left = -aspectRatio * width / 2;
  const right = aspectRatio * width / 2;
  const top = 1 * width / 2;
  const bottom = -1 * width / 2;
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

  useKeybinding(' ', () => {
    sceneStore.setIsPlaying(!sceneStore.isPlaying.getValue());
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

    sceneStore.setGl(gl);

    programs.forEach(({name, vertexShaderSource, fragmentShaderSource, bufferInfoArrays, renderType}) => {
      sceneStore.addProgram(name, vertexShaderSource, fragmentShaderSource, bufferInfoArrays, renderType);
    });

    return () => {
      sceneStore.programs.forEach(({program, bufferInfo}) => {
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
      sceneStore.state().sortedSprites.forEach((sprite) => {
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

    // Resize canvas to match parent container size
    canvas.width = canvas.parentElement?.clientWidth || 0;
    canvas.height = canvas.parentElement?.clientHeight || 0;

    const projectionMatrix = createOrthographicProjectionMatrix(canvas.width, canvas.height);

    const spriteProgram = sceneStore.programs.get('sprite');
    const cameraProgram = sceneStore.programs.get('camera');

    if (!spriteProgram || !cameraProgram) {
      return;
    }

    let animationFrameId: number;
    twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement, 1 || window.devicePixelRatio);

    function render(time: number) {
      const currentFrame = sceneStore.state().currentFrame;

      const playing = sceneStore.isPlaying.getValue();
      const lastPlaying = sceneStore.lastIsPlaying.getValue();

      if (playing && !lastPlaying) {
        startTime.current = time - (currentFrame + 1) * 1000 / fps;
        sceneStore.setLastIsPlaying(true);
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

      const scale = sceneStore.state().scale;

      // viewMatrix is camera position. We want to move the camera in the opposite direction of the model when translating
      let viewMatrix = twgl.m4.translate(twgl.m4.identity(), [0, 0, 0].map(v => -v));
      // We want to implement a camera that can pan and zoom. Zooming is done by scaling the view matrix
      viewMatrix = twgl.m4.scale(viewMatrix, [scale, scale, 1].map(v => 1 / v));

      gl.useProgram(spriteProgram.program.program);

      /**
       * Render sprites
       */
      sceneStore.state().sortedSprites.forEach((sprite, i) => {
        if (!sprite.texture) {
          return;
        }

        const spriteState = sceneStore.nextSpritesParams.getValue()[sprite.id];

        if (!spriteState) {
          return;
        }

        const [x, y] = spriteState.position;

        twgl.setUniforms(spriteProgram.program, {
          u_texture: sprite.texture,
          u_model: twgl.m4.scale(twgl.m4.translate(twgl.m4.identity(), [x, y, i * 0.0001]), [sprite.width, sprite.height, 0]),
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

      const camera = sceneStore.state().camera;

      twgl.setUniforms(cameraProgram.program, {
        u_projection: projectionMatrix,
        u_model: twgl.m4.scale(twgl.m4.translate(twgl.m4.identity(), [camera.x, camera.y, 0]), [camera.width, camera.height, 0]),
        u_view: viewMatrix,
        u_color: [0, 1, 0, 1],
      });

      twgl.drawBufferInfo(gl, cameraProgram.bufferInfo, cameraProgram.renderType);

      /**
       * Render selected sprites box as a rectangle
       */
      sceneStore.state().sortedSprites.forEach((sprite) => {

        if (!sceneStore.state().selectedSpriteIds.includes(sprite.id)) {
          return;
        }

        const spriteState = sceneStore.nextSpritesParams.getValue()[sprite.id];

        if (!spriteState) {
          return;
        }

        twgl.setUniforms(cameraProgram.program, {
          u_projection: projectionMatrix,
          u_model: twgl.m4.scale(twgl.m4.translate(twgl.m4.identity(), spriteState.position), [sprite.width, sprite.height, 0]),
          u_view: viewMatrix,
          u_color: [0, 0, 1, 1],
        });

        twgl.drawBufferInfo(gl, cameraProgram.bufferInfo, cameraProgram.renderType);
      });

      /**
       * Increment frame if playing. Get current frame based on time and fps. Always start from 0
       */
      if (playing) {
        const frame = Math.floor((deltaStartTime.current) / (1000 / fps)) % framesLength;

        // If frame is the same as the current frame, don't update it
        // TODO: Double buffering please
        if (frame !== currentFrame) {
          sceneStore.calculateNextSpritesParams(frame);
          sceneStore.setCurrentFrame(frame);
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
    <div style={{
      width: "100%",
      height: "100%",
    }}>
      <canvas ref={canvasRef}/>
    </div>
  );
}
