import {StoreSubject} from "@anima/store-subject";
import {Sprite, SpriteFrameState} from "./sprite";
import * as twgl from "twgl.js";
import {RenderType} from "./renderType";
import {sortByOrder} from "../helpers/sort-by-order.helper";

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
  sortedSprites: Sprite[]; // Sorted sprites
  selectedSpriteIds: string[];
  currentFrame: number;
}

// TODO: Add to the engine
class Scene {
  public gl = new StoreSubject<WebGLRenderingContext | null>(null);
  public programs = new Map<string, RenderProgram>();

  public _state = new StoreSubject<SceneState>({
    camera: {
      x: 0,
      y: 0,
      width: 1024,
      height: 768,
    },
    scale: 1 / 0.5,
    sprites: {},
    sortedSprites: [],
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

  public setSelectedSpriteByIndex(index: number) {
    const sortedSprites = this._state.getValue().sortedSprites;

    if (sortedSprites[index]) {
      this.setSelectedSpriteId(sortedSprites[index].id);
    }
  }

  public setScale(scale: number) {
    this._state.next({
      ...this._state.getValue(),
      scale,
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
    const newSprites = {
      ...this._state.getValue().sprites,
      [sprite.id]: sprite,
    };

    this._state.next({
      ...this._state.getValue(),
      sprites: newSprites,
      sortedSprites: Object.values(newSprites).sort(sortByOrder),
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

    // Insert a keyframe

    const currentKeyframe = sprite.keyframes.position[this.state().currentFrame];

    // First we need to find the previous and next keyframe
    const previousKeyframe = Object.values(sprite.keyframes.position)
      .reverse()
      .find((keyframe) => keyframe.frame <= this.state().currentFrame);

    const nextKeyframe = Object.values(sprite.keyframes.position)
      .find((keyframe) => keyframe.frame > this.state().currentFrame);

    if (!currentKeyframe) {
      if (previousKeyframe && nextKeyframe) {
        previousKeyframe.next = this.state().currentFrame;
        nextKeyframe.prev = this.state().currentFrame;

        sprite.keyframes.position[this.state().currentFrame] = {
          frame: this.state().currentFrame,
          x,
          y,
          prev: previousKeyframe.frame,
          next: nextKeyframe.frame,
        }
      } else if (previousKeyframe) {
        previousKeyframe.next = this.state().currentFrame;

        sprite.keyframes.position[this.state().currentFrame] = {
          frame: this.state().currentFrame,
          x,
          y,
          prev: previousKeyframe.frame,
          next: null,
        }
      } else if (nextKeyframe) {
        nextKeyframe.prev = this.state().currentFrame;

        sprite.keyframes.position[this.state().currentFrame] = {
          frame: this.state().currentFrame,
          x,
          y,
          prev: null,
          next: nextKeyframe.frame,
        }
      } else {
        sprite.keyframes.position[this.state().currentFrame] = {
          frame: this.state().currentFrame,
          x,
          y,
          prev: null,
          next: null,
        }
      }
    } else {
      currentKeyframe.x = x;
      currentKeyframe.y = y;
    }

    sprite.keyframesIndexes.position.push(this.state().currentFrame);
    sprite.keyframesIndexes.position.sort((a, b) => a - b);

    this._state.next({
      ...this._state.getValue(),
      sprites: {
        ...this._state.getValue().sprites,
        [id]: sprite,
      },
    });

    this.calculateNextSpritesParams(this.state().currentFrame);
  }

  public setSpriteRotation(id: string, angle: number) {
    const sprite = this._state.getValue().sprites[id];

    if (!sprite) {
      return;
    }

    // Insert a keyframe

    const currentKeyframe = sprite.keyframes.rotation[this.state().currentFrame];

    // First we need to find the previous and next keyframe
    const previousKeyframe = Object.values(sprite.keyframes.rotation)
      .reverse()
      .find((keyframe) => keyframe.frame <= this.state().currentFrame);

    const nextKeyframe = Object.values(sprite.keyframes.rotation)
      .find((keyframe) => keyframe.frame > this.state().currentFrame);

    if (!currentKeyframe) {
      if (previousKeyframe && nextKeyframe) {
        previousKeyframe.next = this.state().currentFrame;
        nextKeyframe.prev = this.state().currentFrame;

        sprite.keyframes.rotation[this.state().currentFrame] = {
          frame: this.state().currentFrame,
          angle,
          prev: previousKeyframe.frame,
          next: nextKeyframe.frame,
        }
      } else if (previousKeyframe) {
        previousKeyframe.next = this.state().currentFrame;

        sprite.keyframes.rotation[this.state().currentFrame] = {
          frame: this.state().currentFrame,
          angle,
          prev: previousKeyframe.frame,
          next: null,
        }
      } else if (nextKeyframe) {
        nextKeyframe.prev = this.state().currentFrame;

        sprite.keyframes.rotation[this.state().currentFrame] = {
          frame: this.state().currentFrame,
          angle,
          prev: null,
          next: nextKeyframe.frame,
        }
      } else {
        sprite.keyframes.rotation[this.state().currentFrame] = {
          frame: this.state().currentFrame,
          angle,
          prev: null,
          next: null,
        }
      }
    } else {
      currentKeyframe.angle = angle;
    }

    sprite.keyframesIndexes.rotation.push(this.state().currentFrame);
    sprite.keyframesIndexes.rotation.sort((a, b) => a - b);

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

  public calculateNextSpritesParams(frame: number, update = true) {
    const sprites = this.state().sprites;
    const currentFrame = frame;

    const nextSpritesParams: Record<string, SpriteFrameState> = {};

    for (const spriteId in sprites) {
      const sprite = sprites[spriteId];
      const translateVector = this.getTranslateVector(sprite, currentFrame);
      const rotateAngle = this.getRotateAngle(sprite, currentFrame);

      nextSpritesParams[spriteId] = {
        position: translateVector,
        rotation: rotateAngle,
        scale: [sprite.width, sprite.height],
        opacity: 1,
      }
    }

    if (update) {
      this.nextSpritesParams.next(nextSpritesParams);
    }

    return nextSpritesParams;
  }

  private getTranslateVector(sprite: Sprite, frame: number) {
    const currentPositionKeyframe = sprite.keyframes.position[frame];
    const firstPositionKeyframe = sprite.keyframesIndexes.position[0];
    const lastPositionKeyframe = sprite.keyframesIndexes.position[sprite.keyframesIndexes.position.length - 1];

    let translateVector: [number, number, number] = [sprite.x, sprite.y, 0];

    if (currentPositionKeyframe) {
      translateVector = [
        currentPositionKeyframe.x,
        currentPositionKeyframe.y,
        0
      ];
    }

    if (lastPositionKeyframe !== undefined && frame > lastPositionKeyframe) {
      // Skip interpolation if we are after the last keyframe, just use the last keyframe position
      translateVector = [
        sprite.keyframes.position[lastPositionKeyframe].x,
        sprite.keyframes.position[lastPositionKeyframe].y,
        0
      ];
      // eslint-disable-next-line no-empty
    } else if (firstPositionKeyframe !== undefined && frame < firstPositionKeyframe) {
      // Skip interpolation if we are before the first keyframe
    } else if (!currentPositionKeyframe) {
      // Probably we are in between two keyframes. We need to interpolate the position
      // Find the two keyframes that we are in between
      const kf = sprite.keyframes;

      const previousKeyframe = [...sprite.keyframesIndexes.position].reverse().find((keyframe) => keyframe < frame);

      if (previousKeyframe !== undefined) {
        const nextKeyframe = kf.position[previousKeyframe].next;

        if (nextKeyframe !== null) {
          const previousKeyframePosition = kf.position[previousKeyframe];
          const nextKeyframePosition = kf.position[nextKeyframe];

          const progress = (frame - previousKeyframe) / (nextKeyframe - previousKeyframe);

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
            0,
          ];
        }
      }
    }
    return translateVector;
  }

  private getRotateAngle(sprite: Sprite, frame: number) {
    const currentRotateKeyframe = sprite.keyframes.rotation[frame];
    const firstRotateKeyframe = sprite.keyframesIndexes.rotation[0];
    const lastRotateKeyframe = sprite.keyframesIndexes.rotation[sprite.keyframesIndexes.rotation.length - 1];

    let rotateAngle = sprite.rotation;

    if (currentRotateKeyframe) {
      rotateAngle = currentRotateKeyframe.angle;
    }

    if (lastRotateKeyframe !== undefined && frame > lastRotateKeyframe) {
      // Skip interpolation if we are after the last keyframe, just use the last keyframe position
      rotateAngle = sprite.keyframes.rotation[lastRotateKeyframe].angle;
      // eslint-disable-next-line no-empty
    } else if (firstRotateKeyframe !== undefined && frame < firstRotateKeyframe) {
      // Skip interpolation if we are before the first keyframe
    } else if (!currentRotateKeyframe) {
      // Probably we are in between two keyframes. We need to interpolate the position
      // Find the two keyframes that we are in between
      const kf = sprite.keyframes;

      const previousKeyframe = [...sprite.keyframesIndexes.rotation].reverse().find((keyframe) => keyframe < frame);

      if (previousKeyframe !== undefined) {
        const nextKeyframe = kf.rotation[previousKeyframe].next;

        if (nextKeyframe !== null) {
          const previousKeyframeRotate = kf.rotation[previousKeyframe];
          const nextKeyframeRotate = kf.rotation[nextKeyframe];

          const progress = (frame - previousKeyframe) / (nextKeyframe - previousKeyframe);
          const easedProgress = progress < 0.5 ? Math.pow(progress * 2, 2) / 2 : 1 - Math.pow((1 - progress) * 2, 2) / 2;
          rotateAngle = previousKeyframeRotate.angle + (nextKeyframeRotate.angle - previousKeyframeRotate.angle) * easedProgress;
        }
      }
    }

    return rotateAngle;
  }

  public state() {
    return this._state.getValue();
  }
}

export const engine = new Scene();
