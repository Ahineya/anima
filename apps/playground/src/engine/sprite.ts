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
      flipY: gl.UNPACK_FLIP_Y_WEBGL,
    });
  }
}
