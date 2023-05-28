import {StoreSubject} from "@anima/store-subject";


export type UIPanel = 'viewport' | 'timeline' | 'properties';
export type AppKeybindingState = UIPanel;

export const allKeybindingStates: AppKeybindingState[] = ['viewport', 'timeline', 'properties'];

class UiStore {
  public keybindingsState = new StoreSubject<AppKeybindingState>('viewport');

  public setKeybindingsState(state: AppKeybindingState): void {
    this.keybindingsState.next(state);
  }
}

export const uiStore = new UiStore();
