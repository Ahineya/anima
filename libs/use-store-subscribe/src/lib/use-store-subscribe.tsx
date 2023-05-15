import {StoreSubject} from "@anima/store-subject";
import {useEffect, useState} from "react";

export function useStoreSubscribe<T>(storeSubject: StoreSubject<T>) {
  const [state, setState] = useState(storeSubject.getValue());

  useEffect(() => {
    const unsubscribe = storeSubject.subscribe(setState);
    return () => unsubscribe();
  }, [storeSubject]);

  return state;
}
