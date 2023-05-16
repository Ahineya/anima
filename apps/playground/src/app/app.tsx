import './app.scss';
import {useStoreSubscribe} from "@anima/use-store-subscribe";
import {playgroundStore} from "../stores/playground.store";
import {Panel} from "../components/ui/panel/panel";
import {Viewport} from "../components/viewport/viewport";
import {sceneStore} from "../stores/scene.store";
import {useEffect} from "react";
import {Sprite} from "../engine/sprite";
import myImage from "../assets/i.png";
import myImage2 from "../assets/i2.png";
import {LeftPanel} from "../components/left-panel/left-panel";
import {RightPanel} from "../components/right-panel/right-panel";
import {TimelinePanel} from "../components/timeline-panel/timeline-panel";

function addSprite(gl: WebGLRenderingContext, src: string, name: string) {
  const image = new Image();
  image.addEventListener("load", () => {
    const sprite = new Sprite(gl, image);
    sprite.name = "Asmodeus";
    sceneStore.addSprite(sprite);
  });
  image.src = src;
}

export function App() {

  const gl = useStoreSubscribe(sceneStore.gl);

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

      sprites.forEach((sprite) => {
        sceneStore.addSprite(sprite);
      });
    })();

    return () => {
      sceneStore.clearSprites();
    }
  }, [gl]);

  return (
    <Panel direction="column">
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
