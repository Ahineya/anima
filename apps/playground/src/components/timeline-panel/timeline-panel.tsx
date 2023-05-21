import React, {FC} from "react";
import {Panel} from "../ui/panel/panel";
import {Timeline} from "./timeline";

const fps = 30;
const framesLength = 5 * fps; // 5 seconds

export const TimelinePanel: FC = () => {
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
