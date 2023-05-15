export class StoreSubject<T> {

  currentValue: T;
  subscribers: ((value: T) => void)[] = [];

  constructor(initial: T) {
    this.currentValue = initial;
  }

  public next(value: T) {
    this.currentValue = value;
    this.subscribers.forEach(subscriber => subscriber(value));
  }

  public getValue(): T {
    return this.currentValue;
  }

  public subscribe(next: (value: T) => void) {
    this.subscribers.push(next);
    next(this.currentValue);
    return () => {
      this.subscribers = this.subscribers.filter(subscriber => subscriber !== next);
    };
  }
}
