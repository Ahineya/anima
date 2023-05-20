import React, {FC, useLayoutEffect, useRef} from 'react';
import * as twgl from 'twgl.js';
import {useStoreSubscribe} from "@anima/use-store-subscribe";
import {sceneStore} from "../../stores/scene.store";
import {programs} from "../../engine/programs";
import {useKeybinding} from "../../hooks/use-keybinding.hook";

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

  const sprites = useStoreSubscribe(sceneStore.sprites);
  const selectedSpriteIds = useStoreSubscribe(sceneStore.selectedSpriteIds);

  const selectedSpritesRef = useRef(Object.values(sprites).filter((sprite) => selectedSpriteIds.includes(sprite.id)));
  selectedSpritesRef.current = Object.values(sprites).filter((sprite) => selectedSpriteIds.includes(sprite.id));

  const spritesRef = useRef(Object.values(sprites).sort((a, b) => a.zIndex - b.zIndex));
  spritesRef.current = Object.values(sprites).sort((a, b) => a.zIndex - b.zIndex);

  const playing = useRef(false);
  const lastPlaying = useRef(false);

  const deltaStartTime = useRef(0);
  const startTime = useRef(0);

  useKeybinding(' ', () => {
    lastPlaying.current = playing.current;
    playing.current = !playing.current;
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
      spritesRef.current.forEach((sprite) => {
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
      const currentFrame = sceneStore.currentFrame.getValue();

      if (playing.current && !lastPlaying.current) {
        startTime.current = time - (currentFrame + 1) * 1000 / fps;
        lastPlaying.current = true;
      }

      if (playing.current) {
        deltaStartTime.current = time - startTime.current;
      }

      if (!gl || !canvas || !spriteProgram || !cameraProgram) {
        return;
      }


      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.clearColor(0.18, 0.18, 0.18, 1);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

      twgl.setBuffersAndAttributes(gl, spriteProgram.program, spriteProgram.bufferInfo);

      const scale = sceneStore.scale.getValue();

      // viewMatrix is camera position. We want to move the camera in the opposite direction of the model when translating
      let viewMatrix = twgl.m4.translate(twgl.m4.identity(), [0, 0, 0].map(v => -v));
      // We want to implement a camera that can pan and zoom. Zooming is done by scaling the view matrix
      viewMatrix = twgl.m4.scale(viewMatrix, [scale, scale, 1].map(v => 1 / v));

      gl.useProgram(spriteProgram.program.program);

      spritesRef.current.forEach((sprite) => {
        if (!sprite.texture) {
          return;
        }

        const currentPositionKeyframe = sprite.keyframes.position[currentFrame];
        const firstPositionKeyframe = sprite.keyframesIndexes.position[0];
        const lastPositionKeyframe = sprite.keyframesIndexes.position[sprite.keyframesIndexes.position.length - 1];

        let translateVector: [number, number, number] = [sprite.x, sprite.y, sprite.zIndex];

        if (currentPositionKeyframe) {
          translateVector = [
            currentPositionKeyframe.x,
            currentPositionKeyframe.y,
            sprite.zIndex,
          ];
        }
        //
        if (lastPositionKeyframe !== undefined && currentFrame > lastPositionKeyframe) {
          translateVector = [
            sprite.keyframes.position[lastPositionKeyframe].x,
            sprite.keyframes.position[lastPositionKeyframe].y,
            sprite.zIndex,
          ];
          // eslint-disable-next-line no-empty
        } else if (firstPositionKeyframe !== undefined && currentFrame < firstPositionKeyframe) {
        } else if (!currentPositionKeyframe) {
          // Probably we are in between two keyframes. We need to interpolate the position
          // Find the two keyframes that we are in between
          const kf = sprite.keyframes;

          const previousKeyframe = [...sprite.keyframesIndexes.position].reverse().find((keyframe) => keyframe < currentFrame);

          if (previousKeyframe !== undefined) {
            const nextKeyframe = kf.position[previousKeyframe].next;

            if (nextKeyframe !== null) {
              const previousKeyframePosition = kf.position[previousKeyframe];
              const nextKeyframePosition = kf.position[nextKeyframe];

              const progress = (currentFrame - previousKeyframe) / (nextKeyframe - previousKeyframe);

              // Linear interpolation will do for now. Later we need to implement easing functions, and animation paths
              // translateVector = [
              //   previousKeyframePosition.x + (nextKeyframePosition.x - previousKeyframePosition.x) * progress,
              //   previousKeyframePosition.y + (nextKeyframePosition.y - previousKeyframePosition.y) * progress,
              //   sprite.zIndex,
              // ];
              //
              // Here is an example of how to implement ease out
              // const easedProgress = 1 - Math.pow(1 - progress, 2);
              // translateVector = [
              //   previousKeyframePosition.x + (nextKeyframePosition.x - previousKeyframePosition.x) * easedProgress,
              //   previousKeyframePosition.y + (nextKeyframePosition.y - previousKeyframePosition.y) * easedProgress,
              //   sprite.zIndex,
              // ];

              // Here is an example of how to implement ease in
              // const easedProgress = Math.pow(progress, 2);
              // translateVector = [
              //   previousKeyframePosition.x + (nextKeyframePosition.x - previousKeyframePosition.x) * easedProgress,
              //   previousKeyframePosition.y + (nextKeyframePosition.y - previousKeyframePosition.y) * easedProgress,
              //   sprite.zIndex,
              // ];
              //
              // // Here is an example of how to implement ease in and out
              const easedProgress = progress < 0.5 ? Math.pow(progress * 2, 2) / 2 : 1 - Math.pow((1 - progress) * 2, 2) / 2;
              translateVector = [
                previousKeyframePosition.x + (nextKeyframePosition.x - previousKeyframePosition.x) * easedProgress,
                previousKeyframePosition.y + (nextKeyframePosition.y - previousKeyframePosition.y) * easedProgress,
                sprite.zIndex,
              ];
            }
          }
        }

        twgl.setUniforms(spriteProgram.program, {
          u_texture: sprite.texture,
          u_model: twgl.m4.scale(twgl.m4.translate(twgl.m4.identity(), translateVector), [sprite.width, sprite.height, 0]),
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

      const camera = sceneStore.camera.getValue();

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
      selectedSpritesRef.current.forEach((sprite) => {
        twgl.setUniforms(cameraProgram.program, {
          u_projection: projectionMatrix,
          u_model: twgl.m4.scale(twgl.m4.translate(twgl.m4.identity(), [sprite.x, sprite.y, sprite.zIndex]), [sprite.width, sprite.height, 0]),
          u_view: viewMatrix,
          u_color: [0, 0, 1, 1],
        });

        twgl.drawBufferInfo(gl, cameraProgram.bufferInfo, cameraProgram.renderType);
      });

      /**
       * Increment frame if playing. Get current frame based on time and fps. Always start from 0
       */
      if (playing.current) {
        const frame = Math.floor((deltaStartTime.current) / (1000 / fps)) % framesLength;
        sceneStore.setCurrentFrame(frame);
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
