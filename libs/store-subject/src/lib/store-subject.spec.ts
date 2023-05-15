import { StoreSubject } from './store-subject';

describe('storeSubject', () => {
  it('should work', () => {
    const storeSubject = new StoreSubject(1);
    const next = jest.fn();
    const unsubscribe = storeSubject.subscribe(next);
    expect(next).toHaveBeenCalledWith(1);
    storeSubject.next(2);
    expect(next).toHaveBeenCalledWith(2);
    unsubscribe();
    storeSubject.next(3);
    expect(next).toHaveBeenCalledTimes(2);

    expect(storeSubject.getValue()).toEqual(3);
  });
});
