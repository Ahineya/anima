import * as twgl from "twgl.js";
import {generateKeyBetween} from "fractional-indexing";

export type KeyframeDoublyLinkedList = {
  frame: number,
  next: number | null,
  prev: number | null,
}

export type Keyframes = {
  position: Record<number, {x: number, y: number} & KeyframeDoublyLinkedList>,
  rotation: Record<number, {angle: number} & KeyframeDoublyLinkedList>,
  scale: Record<number, {width: number, height: number} & KeyframeDoublyLinkedList>,
  opacity: Record<number, {opacity: number} & KeyframeDoublyLinkedList>,
}

export type SpriteFrameState = {
  position: [number, number, number];
  rotation: number;
  scale: [number, number];
  opacity: number;
}

export type KeyframeType = keyof Keyframes;

export type KeyframeValue<Type extends KeyframeType> = Type extends 'position' ? {x: number, y: number} : Type extends 'rotation' ? {angle: number} : Type extends 'scale' ? {width: number, height: number} : Type extends 'opacity' ? {opacity: number} : never;

export class Sprite {
  public texture: WebGLTexture;
  public id: string = crypto.randomUUID();
  public type = 'image' as const;
  public x = 0;
  public y = 0;
  public width = 0;
  public height = 0;
  public rotation = 0;
  public parentAndOrder?: string; // In format parentId:order. Fractional ordering in 63-base system
  public name = 'New sprite';
  public order: string = generateKeyBetween(null, null);

  public keyframes: Keyframes = {
    position: {},
    rotation: {},
    scale: {},
    opacity: {},
  };

  public keyframesIndexes: Record<keyof Keyframes, number[]> = {
    position: [],
    rotation: [],
    scale: [],
    opacity: [],
  }

  constructor(private gl: WebGLRenderingContext, private image: HTMLImageElement) {
    this.texture = Sprite.createTexture(gl, image);
    this.width = image.width;
    this.height = image.height;
  }

  static createTexture(gl: WebGLRenderingContext, image: HTMLImageElement): WebGLTexture {
    return twgl.createTexture(gl, {
      src: image,
      min: gl.NEAREST,
      mag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
      flipY: +true,
    });
  }

  static async create(gl: WebGLRenderingContext, url: string, {x, y, width, height, name, z, order}: {x?: number, y?: number, name?: string, width?: number, height?: number, z?: number, order?: string} = {
    x: 0,
    y: 0,
    name: 'New sprite',
  }): Promise<Sprite> {
    return new Promise((resolve) => {
      const image = new Image();
      image.addEventListener("load", () => {
        const sprite = new Sprite(gl, image);
        sprite.x = x || 0;
        sprite.y = y || 0;
        sprite.width = width || image.width;
        sprite.height = height || image.height;
        sprite.name = name || 'New sprite';
        sprite.order = order || generateKeyBetween(null, null);

        resolve(sprite);
      });
      image.src = url;
    });
  }

  static toJSON(sprite: Sprite): Omit<Sprite, 'texture'> {
    return {
      id: sprite.id,
      type: sprite.type,
      x: sprite.x,
      y: sprite.y,
      width: sprite.width,
      height: sprite.height,
      rotation: sprite.rotation,
      name: sprite.name,
      keyframes: sprite.keyframes,
      keyframesIndexes: sprite.keyframesIndexes,
      order: sprite.order,
    };
  }

  static fromJSON(gl: WebGLRenderingContext, json: Omit<Sprite, 'texture'>): Sprite {
    const sprite = new Sprite(gl, new Image());
    sprite.id = json.id;
    sprite.type = json.type;
    sprite.x = json.x;
    sprite.y = json.y;
    sprite.width = json.width;
    sprite.height = json.height;
    sprite.rotation = json.rotation;
    sprite.name = json.name;
    sprite.keyframes = json.keyframes;
    sprite.keyframesIndexes = json.keyframesIndexes;
    return sprite;
  }
}
