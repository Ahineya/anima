import {FC, useMemo} from "react";
import {Panel} from "../ui/panel/panel";
import {sceneStore} from "../../stores/scene.store";
import {useStoreSubscribe} from "@anima/use-store-subscribe";

export const LeftPanel: FC = () => {
  const sceneState = useStoreSubscribe(sceneStore._state);
  const selectedSpriteIds = sceneState.selectedSpriteIds;

  const spritesArray = useMemo(() => Object.values(sceneState.sprites), [sceneState.sprites]);

  const selectSprite = (spriteId: string) => {
    sceneStore.setSelectedSpriteId(spriteId);
  }

  return (
    <Panel
      direction={'column'}
      style={{
        maxWidth: 320,
        minWidth: 320,
        width: 320,
        borderRight: 'var(--border)'
      }}>
      {
        spritesArray.map((sprite) => {
          return (<div
            onClick={() => selectSprite(sprite.id)}
            style={{
              border: `1px solid ${selectedSpriteIds.includes(sprite.id) ? 'red' : 'transparent'}`,
            }}
          >{sprite.name}</div>)
        })
      }
    </Panel>
  )
}
