import {FC, useMemo} from "react";
import {Panel} from "../ui/panel/panel";
import {sceneStore} from "../../stores/scene.store";
import {useStoreSubscribe} from "@anima/use-store-subscribe";

export const RightPanel: FC = () => {
  const state = useStoreSubscribe(sceneStore._state);
  const sprites = state.sprites;

  const selectedSpriteIds = state.selectedSpriteIds;

  const selectedSprites = useMemo(() => {
    return selectedSpriteIds.map((spriteId) => sprites[spriteId]);
  }, [selectedSpriteIds, sprites]);

  const changeSpriteX = (spriteId: string, x: number) => {
    sceneStore.setSpritePosition(spriteId, x, sprites[spriteId].y);
  }

  const changeSpriteY = (spriteId: string, y: number) => {
    sceneStore.setSpritePosition(spriteId, sprites[spriteId].x, y);
  }

  const changeSpriteWidth = (spriteId: string, width: number) => {
    sceneStore.setSpriteSize(spriteId, width, sprites[spriteId].height);
  }

  const changeSpriteHeight = (spriteId: string, height: number) => {
    sceneStore.setSpriteSize(spriteId, sprites[spriteId].width, height);
  }

  return (
    <Panel
      direction={'column'}
      style={{
        maxWidth: 320,
        minWidth: 320,
        width: 320,
        borderLeft: 'var(--border)'
      }}>
      {
        selectedSprites.map((sprite) => {
            return (
              <>
                <div>
                  {sprite.id}
                </div>
                <div>
                  <input
                    value={sprite.name}
                    onChange={(e) => sceneStore.setSpriteName(sprite.id, e.target.value)}
                  />
                </div>
                <div>
                  x:
                  <input
                    type="number"
                    value={sprite.x}
                    onChange={(e) => changeSpriteX(sprite.id, parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  y:
                  <input
                    type="number"
                    value={sprite.y}
                    onChange={(e) => changeSpriteY(sprite.id, parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  width:
                  <input
                    type="number"
                    value={sprite.width}
                    onChange={(e) => changeSpriteWidth(sprite.id, parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  height:
                  <input
                    type="number"
                    value={sprite.height}
                    onChange={(e) => changeSpriteHeight(sprite.id, parseInt(e.target.value, 10))}
                  />
                </div>
              </>
            )
          }
        )}
    </Panel>
  )
}
