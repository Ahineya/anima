import './app.scss';
import {useStoreSubscribe} from "@anima/use-store-subscribe";
import {Panel} from "../components/ui/panel/panel";
import {Viewport} from "../components/viewport/viewport";
import {engine} from "../engine/engine";
import React, {useEffect, useMemo} from "react";
import {Sprite} from "../engine/sprite";
import myImage from "../assets/i.png";
import myImage2 from "../assets/i2.png";
import {LeftPanel} from "../components/left-panel/left-panel";
import {RightPanel} from "../components/right-panel/right-panel";
import {TimelinePanel} from "../components/timeline-panel/timeline-panel";
import {generateKeyBetween} from "fractional-indexing";
import {uiStore} from "../stores/ui.store";
import classNames from "classnames";


export function App() {

  const gl = useStoreSubscribe(engine.gl);
  const keybindingState = useStoreSubscribe(uiStore.keybindingsState);

  useEffect(() => {
    if (!gl) {
      return;
    }

    (async () => {
      const firstSpriteOrder = generateKeyBetween(null, null);
      const secondSpriteOrder = generateKeyBetween(firstSpriteOrder, null);

      const sprites = await Promise.all([
        Sprite.create(gl, myImage, {
          x: 0,
          y: 0,
          name: "Asmodeus",
          order: firstSpriteOrder,
        }),

        Sprite.create(gl, myImage2, {
          x: 512,
          y: -512,
          name: "Queenking",
          z: 0.001,
          order: secondSpriteOrder,
        })
      ]);

      sprites.forEach((sprite) => {
        engine.addSprite(sprite);
      });

      engine.addKeyframe(sprites[0].id, 24, 'position', {
        x: 512,
        y: 512,
      });

      engine.addKeyframe(sprites[0].id, 48, 'position', {
        x: 0,
        y: 0,
      });

      engine.addKeyframe(sprites[0].id, 24, 'rotation', {
        angle: 45,
      });

      engine.addKeyframe(sprites[0].id, 48, 'rotation', {
        angle: 0,
      });

    })();

    return () => {
      engine.clearSprites();
    }
  }, [gl]);

  const onAddImage = (e: React.DragEvent) => {
    e.preventDefault();

    if (!gl) {
      return;
    }

    // If the user drags something that is not an image, we don't want to do anything.
    if (!e.dataTransfer.files[0].type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target!.result as string;

      const lastSprite = engine.state().sortedSprites[engine.state().sortedSprites.length - 1];

      const order = generateKeyBetween(lastSprite?.order, null);

      const sprite = await Sprite.create(gl, src, {
        x: 0,
        y: 0,
        name: "New Sprite",
        order,
      })

      engine.addSprite(sprite);
    }

    reader.readAsDataURL(e.dataTransfer.files[0]);
  }

  return (
    <Panel
      direction="column"
      onDrop={onAddImage}
      onDragOver={e => e.preventDefault()}
      className="app"
    >
      <Panel direction="row">
        <LeftPanel/>
        <Panel
          onClick={() => uiStore.setKeybindingsState('viewport')}
          className={classNames("app-viewport-panel", {
            'panel-active': keybindingState === 'viewport'
          })}
        >
          <Viewport/>
        </Panel>
        <Panel
          direction={'column'}
          onClick={() => uiStore.setKeybindingsState('properties')}
          className={classNames("app-properties-panel", {
            'panel-active': keybindingState === 'properties'
          })}>
          <RightPanel/>
        </Panel>
      </Panel>
      <Panel
        direction={'row'}
        onClick={() => uiStore.setKeybindingsState('timeline')}
        className={classNames("app-timeline-panel", {
          'panel-active': keybindingState === 'timeline'
        })}
      >
        <TimelinePanel/>
      </Panel>
    </Panel>
  );
}

export default App;
