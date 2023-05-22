import React, {FC, PropsWithChildren} from "react";
import {Panel} from "../ui/panel/panel";
import {Timeline} from "./timeline";
import {sceneStore} from "../../stores/scene.store";
import {useStoreSubscribe} from "@anima/use-store-subscribe";

const fps = 30;
const framesLength = 5 * fps; // 5 seconds

const SpriteProperty: FC<PropsWithChildren> = ({children}) => {
  return (
    <Panel
      style={{
        maxHeight: 24,
        borderBottom: 'var(--border)',
        alignItems: 'end',
        justifyContent: 'center',
        padding: '0 8px',
      }}
    >
      {children}
    </Panel>
  )
}

export const TimelinePanel: FC = () => {

  const sceneState = useStoreSubscribe(sceneStore._state);

  return (
    <Panel
      style={{
        maxHeight: 320,
        minHeight: 320,
        height: 320,
        borderTop: 'var(--border)',
      }}
      direction={'row'}
    >
      <Panel
        style={{
          width: 320,
          minWidth: 320,
          maxWidth: 320,
          borderRight: 'var(--border)',
        }}
        direction={'column'}
      >
        <Panel
          style={{
            maxHeight: 24,
            borderBottom: 'var(--border)',
            alignItems: 'end',
            justifyContent: 'center',
            padding: '0 8px',
            fontWeight: 600,
          }}
        >
          Sprite
        </Panel>
        {
          sceneState.sortedSprites.map(s => {
            return (
              <Panel
                key={s.id}
                style={{
                  maxHeight: Object.keys(s.keyframes).length * 24,
                  borderBottom: 'var(--border)',
                  alignItems: 'end',
                  justifyContent: 'center',
                  padding: '0 8px',
                }}
              >
                {s.name}
              </Panel>
            )
          })
        }
      </Panel>
      <Panel
        style={{
          width: 120,
          minWidth: 120,
          maxWidth: 120,
          borderRight: 'var(--border)',
        }}
        direction={'column'}
      >
        <Panel
          style={{
            maxHeight: 24,
            borderBottom: 'var(--border)',
            alignItems: 'end',
            justifyContent: 'center',
            padding: '0 8px',
            fontWeight: 600,
          }}
        >
          Property
        </Panel>
        {
          sceneState.sortedSprites.map(s => {
            return (
              <>
                <SpriteProperty>Position</SpriteProperty>
                <SpriteProperty>Rotation</SpriteProperty>
                <SpriteProperty>Scale</SpriteProperty>
                <SpriteProperty>Opacity</SpriteProperty>
              </>

            )
          })
        }
      </Panel>
      <Panel direction={'column'}>
        <div style={{
          height: 24,
          minHeight: 24,
          maxHeight: 24,
        }}
        />
        <Timeline/>
      </Panel>
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
