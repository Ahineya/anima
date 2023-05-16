import {StoreSubject} from "@anima/store-subject";
import {Sprite} from "../engine/sprite";
import * as twgl from "twgl.js";
import {RenderType} from "../engine/renderType";

type RenderProgram = {
  name: string;
  program: twgl.ProgramInfo;
  bufferInfo: twgl.BufferInfo;
  renderType: number; // gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, gl.POINTS
}

class SceneStore {
  public camera = new StoreSubject({
    x: 0,
    y: 0,
    width: 1024,
    height: 768//1024,
  });

  public scale = new StoreSubject(1);
  public sprites = new StoreSubject({} as Record<string, Sprite>);
  public gl = new StoreSubject<WebGLRenderingContext | null>(null);
  public programs = new Map<string, RenderProgram>();

  public selectedSpriteIds = new StoreSubject<string[]>([]);

  public setGl(gl: WebGLRenderingContext) {
    this.gl.next(gl);
  }

  public setSelectedSpriteId(id: string) {
    this.selectedSpriteIds.next([id]);
  }

  public clearSprites() {
    this.selectedSpriteIds.next([]);
    this.sprites.next({});
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
    this.sprites.next({
      ...this.sprites.getValue(),
      [sprite.id]: sprite,
    });

    this.setSelectedSpriteId(sprite.id);
  }

  public setSpritePosition(id: string, x: number, y: number) {
    const sprite = this.sprites.getValue()[id];

    if (!sprite) {
      return;
    }

    sprite.x = x;
    sprite.y = y;

    this.sprites.next({
      ...this.sprites.getValue(),
      [id]: sprite,
    });
  }

  public setSpriteSize(id: string, width: number, height: number) {
    const sprite = this.sprites.getValue()[id];

    if (!sprite) {
      return;
    }

    sprite.width = width;
    sprite.height = height;

    this.sprites.next({
      ...this.sprites.getValue(),
      [id]: sprite,
    });
  }
}

export const sceneStore = new SceneStore();
