import {StoreSubject} from "@anima/store-subject";
import {Sprite, SpriteFrameState} from "../engine/sprite";
import * as twgl from "twgl.js";
import {RenderType} from "../engine/renderType";

type RenderProgram = {
  name: string;
  program: twgl.ProgramInfo;
  bufferInfo: twgl.BufferInfo;
  renderType: number; // gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, gl.POINTS
}

type CameraState = {
  x: number;
  y: number;
  width: number;
  height: number;
}

type SceneState = {
  camera: CameraState;
  scale: number; // Global scene scale
  sprites: Record<string, Sprite>; // Sprite id -> Sprite
  selectedSpriteIds: string[];
  currentFrame: number;
}

class SceneStore {
  public gl = new StoreSubject<WebGLRenderingContext | null>(null);
  public programs = new Map<string, RenderProgram>();

  public _state = new StoreSubject<SceneState>({
    camera: {
      x: 0,
      y: 0,
      width: 1024,
      height: 768 //1024,
    },
    scale: 1,
    sprites: {},
    currentFrame: 0,
    selectedSpriteIds: [],
  });

  public isPlaying = new StoreSubject<boolean>(false);
  public lastIsPlaying = new StoreSubject<boolean>(false);

  public nextSpritesParams = new StoreSubject<Record<string, SpriteFrameState>>({});
  public nextSpritesScheduledIndex = new StoreSubject<number>(0);

  public setGl(gl: WebGLRenderingContext) {
    this.gl.next(gl);
  }

  public setIsPlaying(isPlaying: boolean) {
    this.lastIsPlaying.next(this.isPlaying.getValue());
    this.isPlaying.next(isPlaying);
  }

  public setLastIsPlaying(isPlaying: boolean) {
    this.lastIsPlaying.next(isPlaying);
  }

  public setSelectedSpriteId(id: string) {
    this._state.next({
      ...this._state.getValue(),
      selectedSpriteIds: [id],
    });
  }

  public clearSprites() {
    this._state.next({
      ...this._state.getValue(),
      sprites: {},
      selectedSpriteIds: [],
    });
  }

  public addProgram(name: string, vertexShaderSource: string, fragmentShaderSource: string, bufferInfoArrays: twgl.Arrays, renderType: RenderType) {
    const gl = this.gl.getValue();

    if (!gl) {
      throw new Error('No gl context');
    }

    let glRenderType: number;

    switch (renderType) {
      case 'triangles':
        glRenderType = gl.TRIANGLES;
        break;
      case 'triangle_strip':
        glRenderType = gl.TRIANGLE_STRIP;
        break;
      case 'triangle_fan':
        glRenderType = gl.TRIANGLE_FAN;
        break;
      case 'lines':
        glRenderType = gl.LINES;
        break;
      case 'line_strip':
        glRenderType = gl.LINE_STRIP;
        break;
      case 'line_loop':
        glRenderType = gl.LINE_LOOP;
        break;
      case 'points':
        glRenderType = gl.POINTS;
        break;
      default:
        throw new Error(`Unknown render type ${renderType}`);
    }

    this.programs.set(name, {
      name,
      program: twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]),
      bufferInfo: twgl.createBufferInfoFromArrays(gl, bufferInfoArrays),
      renderType: glRenderType,
    });
  }

  public addSprite(sprite: Sprite) {
    this._state.next({
      ...this._state.getValue(),
      sprites: {
        ...this._state.getValue().sprites,
        [sprite.id]: sprite,
      },
    });

    this.setSelectedSpriteId(sprite.id);

    this.calculateNextSpritesParams(this.state().currentFrame);
  }

  public setSpriteName(id: string, name: string) {
    const sprite = this._state.getValue().sprites[id];

    if (!sprite) {
      return;
    }

    sprite.name = name;

    this._state.next({
      ...this._state.getValue(),
      sprites: {
        ...this._state.getValue().sprites,
        [id]: sprite,
      },
    });
  }

  public setSpritePosition(id: string, x: number, y: number) {
    const sprite = this._state.getValue().sprites[id];

    if (!sprite) {
      return;
    }

    sprite.x = x;
    sprite.y = y;

    this._state.next({
      ...this._state.getValue(),
      sprites: {
        ...this._state.getValue().sprites,
        [id]: sprite,
      },
    });

    this.calculateNextSpritesParams(this.state().currentFrame);
  }

  public setSpriteSize(id: string, width: number, height: number) {
    const sprite = this._state.getValue().sprites[id];

    if (!sprite) {
      return;
    }

    sprite.width = width;
    sprite.height = height;

    this._state.next({
      ...this._state.getValue(),
      sprites: {
        ...this._state.getValue().sprites,
        [id]: sprite,
      },
    });

    this.calculateNextSpritesParams(this.state().currentFrame);
  }

  public setCurrentFrame(frame: number) {
    this._state.next({
      ...this._state.getValue(),
      currentFrame: frame,
    });
  }

  public calculateNextSpritesParams(frame: number) {
    const sprites = this.state().sprites;
    const currentFrame = frame;

    const nextSpritesParams: Record<string, SpriteFrameState> = {};

    for (const spriteId in sprites) {
      const sprite = sprites[spriteId];
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

      nextSpritesParams[spriteId] = {
        position: translateVector,
        rotation: 0,
        scale: [sprite.width, sprite.height],
        opacity: 1,
        zIndex: sprite.zIndex,
      }
    }

    this.nextSpritesParams.next(nextSpritesParams);
    this.nextSpritesScheduledIndex.next(frame);
  }

  public state() {
    return this._state.getValue();
  }
}

export const sceneStore = new SceneStore();
