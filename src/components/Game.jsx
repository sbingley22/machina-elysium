/* eslint-disable react/no-unknown-property */
import { KeyboardControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense, useState } from "react"
import SideBar from "./SideBar";


const Game = () => {
  const [currentCursor, setCurrentCursor] = useState('crosshair');
  
  return (
    <div className="game">
      <div>
        <KeyboardControls 
          map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
          { name: "typeMode", keys: ["Space"] },
          { name: "interact", keys: ["f", "F"] },
          { name: "inventory", keys: ["`"] },
          ]}
        >
          <Canvas shadows style={{cursor: currentCursor}}>
            <Suspense>

            </Suspense>
          </Canvas>
        </KeyboardControls>
      </div>
      <SideBar />
    </div>
  )
}

export default Game