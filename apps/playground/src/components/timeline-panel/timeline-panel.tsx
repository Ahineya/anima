import React, {FC} from "react";
import {Panel} from "../ui/panel/panel";

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
      Timeline
    </Panel>
  )
}
