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

export function App() {

  const gl = useStoreSubscribe(sceneStore.gl);

  useEffect(() => {
    if (!gl) {
      return;
    }

    const image = new Image();
    image.addEventListener("load", () => {
      const sprite = new Sprite(gl, image)
      sceneStore.addSprite(sprite);
    });
    image.src = myImage;

    const image2 = new Image();
    image2.addEventListener("load", () => {
      const sprite = new Sprite(gl, image2);
      sprite.x = 512;
      sprite.zIndex = 1 * 0.001;
      sceneStore.addSprite(sprite);
    });

    image2.src = myImage2;
  }, [gl]);

  return (
    <Panel>
        <Viewport />
    </Panel>
  );
}

export default App;
