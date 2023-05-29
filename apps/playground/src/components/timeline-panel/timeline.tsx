import React, {useLayoutEffect, useRef} from "react";
import * as twgl from "twgl.js";
import {programs} from "../../engine/programs";
import {engine} from "../../engine/engine";
import {KeyframeType} from "../../engine/sprite";
import {useKeybinding} from "../../hooks/use-keybinding.hook";

const rot45 = (Math.PI / 180) * 45;

export const Timeline = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useKeybinding('ArrowLeft', () => {
    if (engine.isPlaying.getValue()) {
      return;
    }

    let newFrame = engine.state().currentFrame - 1;
    if (newFrame < 0) {
      newFrame = engine.state().lengthInFrames - 1;
    }

    engine.calculateNextSpritesParams(newFrame);
    engine.setCurrentFrame(newFrame);
  }, true, ['timeline']);

  useKeybinding('shift-ArrowLeft', () => {
    if (engine.isPlaying.getValue()) {
      return;
    }

    let newFrame = engine.state().currentFrame - engine.state().fps;
    if (newFrame < 0) {
      if (engine.state().currentFrame === 0) {
        newFrame = engine.state().lengthInFrames - 1;
      } else {
        newFrame = 0;
      }
    }

    engine.calculateNextSpritesParams(newFrame);
    engine.setCurrentFrame(newFrame);
  }, true, ['timeline']);

  useKeybinding('ArrowRight', () => {
    if (engine.isPlaying.getValue()) {
      return;
    }

    let newFrame = engine.state().currentFrame + 1;
    if (newFrame >= engine.state().lengthInFrames) {
        newFrame = 0;
    }

    engine.calculateNextSpritesParams(newFrame);
    engine.setCurrentFrame(newFrame);
  }, true, ['timeline']);

  useKeybinding('shift-ArrowRight', () => {
    if (engine.isPlaying.getValue()) {
      return;
    }

    let newFrame = engine.state().currentFrame + engine.state().fps;
    if (newFrame >= engine.state().lengthInFrames) {
      if (engine.state().currentFrame === engine.state().lengthInFrames - 1) {
        newFrame = 0;
      } else {
        newFrame = engine.state().lengthInFrames - 1;
      }
    }

    engine.calculateNextSpritesParams(newFrame);
    engine.setCurrentFrame(newFrame);
  }, true, ['timeline']);

  useKeybinding('delete', () => {
    if (engine.isPlaying.getValue()) {
      return;
    }

    engine.deleteCurrentKeyframe();
  }, true, ['timeline']);

  const setActiveFrame = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    // If not left click
    if (e.button !== 0) {
      return;
    }

    // Get canvas element relative position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0) {
      return;
    }

    const frame = Math.floor(x / 12);
    const row = Math.floor(y / 24);

    const rowsCount = engine.state().sortedSprites.reduce((acc, sprite) => {
      return acc + Object.keys(sprite.keyframes).length;
    }, 0);

    if (row > rowsCount - 1) {
      return;
    }

    console.log(frame, row);

    const spriteIndex = Math.floor(y / (4 * 24));
    console.log('Sprite index', spriteIndex);

    const selectedPropertyIndex = row % 4;

    const properties = Object.keys(engine.state().sortedSprites[spriteIndex].keyframes) as KeyframeType[];
    const property: KeyframeType = properties[selectedPropertyIndex];

    engine.setIsPlaying(false);

    engine.calculateNextSpritesParams(frame);
    engine.setCurrentFrame(frame);
    engine.setSelectedSpriteByIndex(spriteIndex);
    engine.setSelectedProperty(property);
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

    const timelineGridProgramInfo = twgl.createProgramInfo(gl, [timelineGridProgram.vertexShaderSource, timelineGridProgram.fragmentShaderSource]);
    const timelineGridBufferInfo = twgl.createBufferInfoFromArrays(gl, timelineGridProgram.bufferInfoArrays);

    const keyframeProgram = programs.find(program => program.name === 'timeline-keyframe')!;

    const keyframeProgramInfo = twgl.createProgramInfo(gl, [keyframeProgram.vertexShaderSource, keyframeProgram.fragmentShaderSource]);
    const keyframeBufferInfo = twgl.createBufferInfoFromArrays(gl, keyframeProgram.bufferInfoArrays);

    twgl.setBuffersAndAttributes(gl, timelineGridProgramInfo, timelineGridBufferInfo);
    twgl.setBuffersAndAttributes(gl, keyframeProgramInfo, keyframeBufferInfo);


    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    console.log(gl.canvas.width, gl.canvas.height)

    function render() {
      if (!gl) {
        requestAnimationFrame(render);
        return;
      }

      const rowsCount = engine.state().sortedSprites.reduce((acc, sprite) => {
        return acc + Object.keys(sprite.keyframes).length;
      }, 0);

      gl.clearColor(57 / 255, 56 / 255, 58 / 255, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const blockWidthInPixels = 12;
      const blockHeightInPixels = 24;

      gl.useProgram(timelineGridProgramInfo.program);

      // Find selected row
      const selectedSpriteId = engine.state().selectedSpriteIds[0];
      const selectedSpriteIndex = engine.state().sortedSprites.findIndex(sprite => sprite.id === selectedSpriteId);

      const selectedProperty = engine.state().selectedProperty;

      let selectedPropertyIndex = -1;

      if (engine.state().sortedSprites[selectedSpriteIndex]) {
        selectedPropertyIndex = Object.keys(engine.state().sortedSprites[selectedSpriteIndex].keyframes).findIndex(property => property === selectedProperty);
      }

      const selectedRow = selectedSpriteIndex * 4 + selectedPropertyIndex;

      twgl.setUniforms(timelineGridProgramInfo, {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_gridSize: [blockWidthInPixels, blockHeightInPixels],
        u_color: [0x4f / 255, 0x4b / 255, 0x4f / 255, 1],

        u_ratio: devicePixelRatio,

        u_rows: rowsCount,
        u_columns: engine.state().lengthInFrames,

        u_selectedColumn: engine.state().currentFrame,
        u_selectedRow: selectedRow,

        u_model: twgl.m4.translate(twgl.m4.identity(), [0, 0, 0]),
      });

      twgl.drawBufferInfo(gl, timelineGridBufferInfo);

      gl.useProgram(keyframeProgramInfo.program);

      // Draw keyframes
      // TODO: This catastrophe should use instancing
      engine.state().sortedSprites.forEach((sprite, spriteIndex) => {
        const scaleX = 1 / (gl.canvas.width / 2 * devicePixelRatio);
        const scaleY = 1 / (gl.canvas.height / 2 * devicePixelRatio);

        const initialXOffset = scaleX * 24;
        const oneFrameXOffset = scaleX * 48;

        // TODO: It can be simplified by iterating over sprite.keyframes keys
        Object.values(sprite.keyframes.position).forEach((keyframe) => {

          if (keyframe.frame > engine.state().lengthInFrames) {
            return;
          }

          const initialYOffset = -scaleY * 48;
          const oneFrameYOffset = (-scaleY * 96);

          const translatedPx = twgl.m4.translate(twgl.m4.identity(), [initialXOffset + oneFrameXOffset * keyframe.frame, initialYOffset + (oneFrameYOffset * spriteIndex * 4), 0]);
          const translated = twgl.m4.translate(translatedPx, [-1, 1, 0]);
          const scaled = twgl.m4.scale(translated, [scaleX * 12, scaleY * 12, 0]);
          const rotated = twgl.m4.rotateZ(scaled, rot45);

          const keyframeColor = sprite.id === selectedSpriteId && keyframe.frame === engine.state().currentFrame && selectedProperty === 'position'
            ? [0x00 / 255, 0x00 / 255, 0x00 / 255, 1]
            : [0xAD / 255, 0xA8 / 255, 0xAD / 255, 1];

          twgl.setUniforms(keyframeProgramInfo, {
            u_color: keyframeColor,
            u_model: rotated,
          });

          twgl.drawBufferInfo(gl, timelineGridBufferInfo);
        });

        Object.values(sprite.keyframes.rotation).forEach((keyframe) => {
          if (keyframe.frame > engine.state().lengthInFrames) {
            return;
          }

          const initialYOffset = -scaleY * 48;
          const oneFrameYOffset = (-scaleY * 96);

          const translatedPx = twgl.m4.translate(twgl.m4.identity(), [initialXOffset + oneFrameXOffset * keyframe.frame, initialYOffset + oneFrameYOffset + (oneFrameYOffset * spriteIndex * 4), 0]);
          const translated = twgl.m4.translate(translatedPx, [-1, 1, 0]);
          const scaled = twgl.m4.scale(translated, [scaleX * 12, scaleY * 12, 0]);
          const rotated = twgl.m4.rotateZ(scaled, rot45);

          const keyframeColor = sprite.id === selectedSpriteId && keyframe.frame === engine.state().currentFrame && selectedProperty === 'rotation'
            ? [0x00 / 255, 0x00 / 255, 0x00 / 255, 1]
            : [0xAD / 255, 0xA8 / 255, 0xAD / 255, 1];

          twgl.setUniforms(keyframeProgramInfo, {
            u_color: keyframeColor,
            u_model: rotated,
          });

          twgl.drawBufferInfo(gl, timelineGridBufferInfo);
        });

        Object.values(sprite.keyframes.scale).forEach((keyframe) => {
          if (keyframe.frame > engine.state().lengthInFrames) {
            return;
          }

          const initialYOffset = -scaleY * 48;
          const oneFrameYOffset = (-scaleY * 96);

          const translatedPx = twgl.m4.translate(twgl.m4.identity(), [initialXOffset + oneFrameXOffset * keyframe.frame, initialYOffset + oneFrameYOffset * 2 + (oneFrameYOffset * spriteIndex * 4), 0]);
          const translated = twgl.m4.translate(translatedPx, [-1, 1, 0]);
          const scaled = twgl.m4.scale(translated, [scaleX * 12, scaleY * 12, 0]);
          const rotated = twgl.m4.rotateZ(scaled, rot45);

          const keyframeColor = sprite.id === selectedSpriteId && keyframe.frame === engine.state().currentFrame && selectedProperty === 'scale'
            ? [0x00 / 255, 0x00 / 255, 0x00 / 255, 1]
            : [0xAD / 255, 0xA8 / 255, 0xAD / 255, 1];

          twgl.setUniforms(keyframeProgramInfo, {
            u_color: keyframeColor,
            u_model: rotated,
          });

          twgl.drawBufferInfo(gl, timelineGridBufferInfo);
        });

      });

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
    }}
         onMouseDown={setActiveFrame}

    >
      <canvas
        ref={canvasRef}
      />
    </div>
  )
}
