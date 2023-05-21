import './app.scss';
import {useStoreSubscribe} from "@anima/use-store-subscribe";
import {playgroundStore} from "../stores/playground.store";
import {Panel} from "../components/ui/panel/panel";
import {Viewport} from "../components/viewport/viewport";
import {sceneStore} from "../stores/scene.store";
import React, {useEffect} from "react";
import {Sprite} from "../engine/sprite";
import myImage from "../assets/i.png";
import myImage2 from "../assets/i2.png";
import {LeftPanel} from "../components/left-panel/left-panel";
import {RightPanel} from "../components/right-panel/right-panel";
import {TimelinePanel} from "../components/timeline-panel/timeline-panel";

export function App() {

  const gl = useStoreSubscribe(sceneStore.gl);
  const state = useStoreSubscribe(sceneStore._state);

  useEffect(() => {
    if (!gl) {
      return;
    }

    (async () => {
      const sprites = await Promise.all([
        Sprite.create(gl, myImage, {
          x: 0,
          y: 0,
          name: "Asmodeus",
        }),

        Sprite.create(gl, myImage2, {
          x: 512,
          y: -512,
          name: "Queenking",
          z: 0.001
        })
      ]);

      sprites[0].keyframes = {
        ...sprites[0].keyframes,
        position: {
          24: {
            frame: 24,
            x: 512,
            y: 512,
            prev: 0,
            next: 48,
          },
          48: {
            frame: 48,
            x: 0,
            y: 0,
            prev: 24,
            next: 72,
          },
          72: {
            frame: 72,
            x: 512,
            y: 0,
            prev: 48,
            next: null,
          }
        }
      }

      sprites[0].keyframesIndexes = {
        ...sprites[0].keyframesIndexes,
        position: Object.keys(sprites[0].keyframes.position).map(Number).sort((a, b) => a - b),
      };

      sprites.forEach((sprite) => {
        sceneStore.addSprite(sprite);
      });
    })();

    return () => {
      sceneStore.clearSprites();
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

      // Get max z
      const maxZ = Object.values(state.sprites).reduce((max, sprite) => {
        return Math.max(max, sprite.zIndex);
      }, 0);

      const sprite = await Sprite.create(gl, src, {
        x: 0,
        y: 0,
        name: "New Sprite",
        z: maxZ + 0.001
      })

      sceneStore.addSprite(sprite);
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
