import {FC, useMemo} from "react";
import {Panel} from "../ui/panel/panel";
import {engine} from "../../engine/scene";
import {useStoreSubscribe} from "@anima/use-store-subscribe";

export const RightPanel: FC = () => {
  const state = useStoreSubscribe(engine._state);
  const isPlaying = useStoreSubscribe(engine.isPlaying);
  const sprites = state.sprites;

  const selectedSpriteIds = state.selectedSpriteIds;

  const nextSpritesParams = useStoreSubscribe(engine.nextSpritesParams);

  const selectedSpritesParams = useMemo(() => {
    return selectedSpriteIds.map((spriteId) => {
      return {
        id: spriteId,
        width: sprites[spriteId].width,
        height: sprites[spriteId].height,
        name: sprites[spriteId].name,
        params: nextSpritesParams[spriteId]
      }
    });
  }, [selectedSpriteIds, nextSpritesParams]);

  const changeSpriteX = (spriteId: string, x: number) => {
    const spriteParams = selectedSpritesParams.find(s => s.id === spriteId);
    engine.setSpritePosition(spriteId, x, spriteParams?.params.position[1] ?? sprites[spriteId].y);
  }

  const changeSpriteY = (spriteId: string, y: number) => {
    const spriteParams = selectedSpritesParams.find(s => s.id === spriteId);
    engine.setSpritePosition(spriteId, spriteParams?.params.position[0] ?? sprites[spriteId].x, y);
  }

  const changeSpriteWidth = (spriteId: string, width: number) => {
    engine.setSpriteSize(spriteId, width, sprites[spriteId].height);
  }

  const changeSpriteHeight = (spriteId: string, height: number) => {
    engine.setSpriteSize(spriteId, sprites[spriteId].width, height);
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
      <input
        type="range"
        min={0.1}
        max={10}
        step={0.1}
        value={1 / state.scale}
        onChange={(e) => engine.setScale(1 / parseFloat(e.target.value))}
      />
      {
        !isPlaying && selectedSpritesParams.map((sprite) => {
            return (
              <>
                <div>
                  {sprite.id}
                </div>
                <div>
                  <input
                    value={sprite.name}
                    onChange={(e) => engine.setSpriteName(sprite.id, e.target.value)}
                  />
                </div>
                <div>
                  x:
                  <input
                    type="number"
                    value={sprite.params.position[0]}
                    onChange={(e) => changeSpriteX(sprite.id, parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  y:
                  <input
                    type="number"
                    value={sprite.params.position[1]}
                    onChange={(e) => changeSpriteY(sprite.id, parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  rotation:
                  <input
                    type="number"
                    value={sprite.params.rotation}
                    onChange={(e) => engine.setSpriteRotation(sprite.id, parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  width:
                  <input
                    type="number"
                    value={sprite.params.scale[0]}
                    onChange={(e) => changeSpriteWidth(sprite.id, parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  height:
                  <input
                    type="number"
                    value={sprite.params.scale[1]}
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
