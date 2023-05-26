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
        minHeight: 24,
        maxHeight: 24,
        borderBottom: 'var(--border)',
        alignItems: 'end',
        justifyContent: 'center',
        padding: '0 8px',
        color: 'var(--color-text-muted)',
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
            minHeight: 24,
            maxHeight: 24,
            borderBottom: 'var(--border)',
            alignItems: 'end',
            justifyContent: 'center',
            padding: '0 8px',
            fontWeight: 400,
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
                  minHeight: Object.keys(s.keyframes).length * 24,
                  maxHeight: Object.keys(s.keyframes).length * 24,
                  borderBottom: 'var(--border)',
                  alignItems: 'end',
                  justifyContent: 'center',
                  padding: '0 8px',
                  backgroundColor: sceneState.selectedSpriteIds.includes(s.id) ? 'var(--color-panel-selected)' : 'var(--color-panel)',
                }}
                onClick={() => {
                  sceneStore.setSelectedSpriteId(s.id);
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
            minHeight: 24,
            maxHeight: 24,
            borderBottom: 'var(--border)',
            alignItems: 'end',
            justifyContent: 'center',
            padding: '0 8px',
            fontWeight: 400,
          }}
        >
          Property
        </Panel>
        {
          sceneState.sortedSprites.map(s => {
            return (
              <Panel
                onClick={() => {
                  sceneStore.setSelectedSpriteId(s.id);
                }}
                style={{
                  minHeight: 24 * 4,
                  maxHeight: 24 * 4,
                }}
              >
                <SpriteProperty>Position</SpriteProperty>
                <SpriteProperty>Rotation</SpriteProperty>
                <SpriteProperty>Scale</SpriteProperty>
                <SpriteProperty>Opacity</SpriteProperty>
              </Panel>

            )
          })
        }
      </Panel>
      <Panel direction={'column'}>
        <div style={{
          height: 24,
          minHeight: 24,
          maxHeight: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
        >
          {
            Array.from(Array(framesLength).keys()).map((_, i) => {
              // Every fps frames, add a label
              if (i % fps === 0) {
                return (
                  <div
                    key={i}
                    style={{
                      width: 12,
                      height: 24,
                      minHeight: 24,
                      maxHeight: 24,
                      borderLeft: i !== 0 ? 'var(--border)' : 'none',
                      position: 'absolute',
                      left: i * 12,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '10px',
                      paddingLeft: '2px',
                      color: 'var(--color-text-muted)',
                    }}>
                    {i / fps}s
                  </div>
                )
              }
            })
          }
        </div>
        <Timeline/>
      </Panel>
    </Panel>
  )
}
