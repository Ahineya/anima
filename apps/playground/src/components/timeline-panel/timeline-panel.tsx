import React, {FC, useMemo} from "react";
import {Panel} from "../ui/panel/panel";
import {sceneStore} from "../../stores/scene.store";
import {useStoreSubscribe} from "@anima/use-store-subscribe";
import {Timeline} from "./timeline";

const fps = 30;
const framesLength = 5 * fps; // 5 seconds

const frames = Array.from({length: framesLength}, (_, i) => i);

export const TimelinePanel: FC = () => {

  const currentFrame = useStoreSubscribe(sceneStore.currentFrame);
  const selectedSpriteIds = useStoreSubscribe(sceneStore.selectedSpriteIds);
  const spritesMap = useStoreSubscribe(sceneStore.sprites);

  const sprites = useMemo(() => {
    return Object.values(spritesMap);
  }, [spritesMap]);

  return (
    <Panel
      style={{
        maxHeight: 320,
        minHeight: 320,
        height: 320,
        borderTop: 'var(--border)',
      }}
    >
      <Timeline/>
      {/*<div*/}
      {/*  style={{*/}
      {/*    display: 'flex',*/}
      {/*    flexDirection: 'column',*/}
      {/*  }}*/}
      {/*>*/}
      {/*  {*/}
      {/*    sprites.map(s => {*/}

      {/*      return Object.keys(s.keyframes).map(key => {*/}
      {/*        const keyframes = s.keyframes[key as keyof typeof s.keyframes];*/}

      {/*        return (*/}
      {/*          <div*/}
      {/*            style={{*/}
      {/*              display: 'flex',*/}
      {/*              flexDirection: 'row',*/}
      {/*              height: '24px',*/}
      {/*              borderBottom: 'var(--border)',*/}
      {/*            }}*/}
      {/*          >*/}
      {/*            {*/}
      {/*              frames.map((frame) => {*/}
      {/*                return (*/}
      {/*                  <div*/}
      {/*                    style={{*/}
      {/*                      width: '12px',*/}
      {/*                      minWidth: '12px',*/}
      {/*                      height: '100%',*/}
      {/*                      borderRight: 'var(--border)',*/}
      {/*                      backgroundColor: keyframes[frame] ? 'red' : 'transparent',*/}
      {/*                      // borderBottom: `1px solid ${frame === currentFrame ? 'green' : 'transparent'}`,*/}
      {/*                      outline: `1px solid ${frame === currentFrame ? 'green' : 'transparent'}`,*/}
      {/*                    }}*/}
      {/*                    onClick={() => sceneStore.setCurrentFrame(frame)}*/}
      {/*                  >*/}

      {/*                  </div>*/}
      {/*                )*/}
      {/*              })*/}
      {/*            }*/}
      {/*          </div>*/}
      {/*        )*/}
      {/*      })*/}
      {/*    })*/}
      {/*  }*/}

      {/*</div>*/}
      {/*<div>*/}
      {/*  {currentFrame}*/}
      {/*</div>*/}
    </Panel>
  )
}
