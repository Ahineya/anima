import * as twgl from "twgl.js";

export class Sprite {
  public texture: WebGLTexture;
  public id: string = crypto.randomUUID();
  public type = 'image' as const;
  public x = 0;
  public y = 0;
  public width = 0;
  public height = 0;
  public parentAndOrder?: string; // In format parentId:order. Fractional ordering in 63-base system
  public zIndex = 0;
  public name = 'New sprite';

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

  static async create(gl: WebGLRenderingContext, url: string, {x, y, width, height, name, z}: {x?: number, y?: number, name?: string, width?: number, height?: number, z?: number} = {
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
        sprite.zIndex = z || 0;
        sprite.width = width || image.width;
        sprite.height = height || image.height;
        sprite.name = name || 'New sprite';

        resolve(sprite);
      });
      image.src = url;
    });
  }
}
