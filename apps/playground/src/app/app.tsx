import './app.scss';
import {useStoreSubscribe} from "@anima/use-store-subscribe";
import {Panel} from "../components/ui/panel/panel";
import {Viewport} from "../components/viewport/viewport";
import {engine} from "../engine/scene";
import React, {useEffect} from "react";
import {Sprite} from "../engine/sprite";
import myImage from "../assets/i.png";
import myImage2 from "../assets/i2.png";
import {LeftPanel} from "../components/left-panel/left-panel";
import {RightPanel} from "../components/right-panel/right-panel";
import {TimelinePanel} from "../components/timeline-panel/timeline-panel";
import {generateKeyBetween} from "fractional-indexing";
import {sortByOrder} from "../helpers/sort-by-order.helper";


export function App() {

  const gl = useStoreSubscribe(engine.gl);

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

      sprites[1].rotation = 45;

      sprites[0].keyframes = {
        ...sprites[0].keyframes,
        rotation: {
          24: {
            frame: 24,
            angle: 0,
            prev: 0,
            next: 48,
          },
          48: {
            frame: 48,
            angle: 45,
            prev: 24,
            next: 72,
          },
          72: {
            frame: 72,
            angle: -45,
            prev: 48,
            next: null,
          }
        }
      }

      sprites[0].keyframesIndexes = {
        ...sprites[0].keyframesIndexes,
        position: Object.keys(sprites[0].keyframes.position).map(Number).sort((a, b) => a - b),
        rotation: Object.keys(sprites[0].keyframes.rotation).map(Number).sort((a, b) => a - b),
      };

      sprites.forEach((sprite) => {
        engine.addSprite(sprite);
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
    <Panel direction="column" onDrop={onAddImage} onDragOver={e => e.preventDefault()}>
      <Panel direction="row">
        <LeftPanel/>
        <Panel>
          <Viewport/>
        </Panel>
        <RightPanel/>
      </Panel>
      <TimelinePanel/>
    </Panel>
  );
}

export default App;
