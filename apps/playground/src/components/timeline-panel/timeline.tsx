import {useLayoutEffect, useRef} from "react";
import * as twgl from "twgl.js";
import {programs} from "../../engine/programs";
import {sceneStore} from "../../stores/scene.store";

const fps = 30;
const framesLength = 5 * fps;

export const Timeline = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const setActiveFrame = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Get canvas element relative position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const frame = Math.floor(x / 12);

    sceneStore.setIsPlaying(false);

    sceneStore.calculateNextSpritesParams(frame);
    sceneStore.setCurrentFrame(frame);
  }

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) {
      return;
    }

    canvas.width = canvasContainer.clientWidth * window.devicePixelRatio;
    canvas.height = canvasContainer.clientHeight * window.devicePixelRatio;

    canvas.style.width = `${canvasContainer.clientWidth}px`;
    canvas.style.height = `${canvasContainer.clientHeight}px`;

    const gl = canvas.getContext("webgl2");

    if (!gl) {
      return;
    }

    const timelineGridProgram = programs.find(program => program.name === 'timeline-grid')!;

    const programInfo = twgl.createProgramInfo(gl, [timelineGridProgram.vertexShaderSource, timelineGridProgram.fragmentShaderSource]);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, timelineGridProgram.bufferInfoArrays);

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    console.log(gl.canvas.width, gl.canvas.height)


    function render() {
      if (!gl) {
        requestAnimationFrame(render);
        return;
      }

      const rowsCount = sceneStore.state().sortedSprites.reduce((acc, sprite) => {
        return acc + Object.keys(sprite.keyframes).length;
      }, 0);

      gl.clearColor(57 / 255, 56 / 255, 58 / 255, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const blockWidthInPixels = 12;
      const blockHeightInPixels = 24;

      gl.useProgram(programInfo.program);

      twgl.setUniforms(programInfo, {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_gridSize: [blockWidthInPixels, blockHeightInPixels],
        u_color: [70 / 255, 66 / 255, 70 / 255, 1],

        u_ratio: devicePixelRatio,

        u_rows: rowsCount,
        u_columns: framesLength,

        u_selectedColumn: sceneStore.state().currentFrame,

        u_model: twgl.m4.translate(twgl.m4.identity(), [0, 0, 0]),
      });

      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }

    render();
  }, []);

  return (
    <div ref={canvasContainerRef} style={{
      maxHeight: '320px',
      height: '320px',
      width: '100%',
      maxWidth: '100%',
    }}>
      <canvas
        ref={canvasRef}
        onPointerDown={setActiveFrame}
      />
    </div>
  )
}
