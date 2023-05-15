import {StoreSubject} from "@anima/store-subject";

class PlaygroundStore {
  public someValue = new StoreSubject('Hello');

  public image = new StoreSubject<HTMLImageElement | null>(null);
  public image2 = new StoreSubject<HTMLImageElement | null>(null);

  public changeValue() {
    this.someValue.next('World');
  }

  public setImage(image: HTMLImageElement) {
    this.image.next(image);
  }

  public setImage2(image: HTMLImageElement) {
    this.image2.next(image);
  }
}

export const playgroundStore = new PlaygroundStore();
