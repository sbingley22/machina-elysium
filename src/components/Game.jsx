/* eslint-disable react/no-unknown-property */
import { KeyboardControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense, useEffect, useRef, useState } from "react"
import SideBar from "./SideBar"
import levelsJson from '../assets/levels.json'
import Arena from "./Arena"
import DialogUi from "./DialogUi"


const Game = () => {
  const [currentCursor, setCurrentCursor] = useState('crosshair')
  const backgroundRef = useRef(null)

  const [levelData, setLevelData] = useState(levelsJson)
  const [level, setLevel] = useState(null)
  const [zone, setZone] = useState(0)
  const [levelDoor, setLevelDoor] = useState("a")

  const [playerDestination, setPlayerDestination] = useState([-1,-1])
  const [destinationAction, setDestinationAction] = useState(null)
  const [reachedDestination, setReachedDestination] = useState(null)

  const [inventory, setInventory] = useState([])
  const [dialog, setDialog] = useState([])

  const [rmb, setRmb] = useState(false)
  const [takeShot, setTakeShot] = useState(-1)
  const [shotCharge, setShotCharge] = useState(0)
  const [photoImg, setPhotoImg] = useState("nothing")

  const [playAudio, setPlayAudio] = useState(null)
  const cameraClickAudio = useRef()
  const femaleHurtAudio = useRef()
  const droneGrowlAudio = useRef()

  const loadLevel = (lvl) => {
    if (level) setLevelDoor(level)
    setLevel(lvl)
  }  
  
  // Handle mouse move and click
  useEffect(() => {
    const isOverDoor = (x,y) => {
      const lvl = levelData[level].zones[zone]
      if (!lvl) return null

      let inDoor = null
      lvl.doors.forEach( (door, index) => {
        if (x < parseInt(door.sx1)) return
        if (x > parseInt(door.sx2)) return
        if (y < parseInt(door.sy1)) return
        if (y > parseInt(door.sy2)) return
        inDoor = index
      })

      return inDoor
    }

    const isOverItem = (x,y) => {
      const lvl = levelData[level]
      if (!level) return null

      let overItem = null
      if (!lvl.items) return null
      lvl.items.forEach( (item, index) => {
        if (item.collected) return
        const sx =  parseInt(item.sx)
        const sy =  parseInt(item.sy)
        const radius =  parseInt(item.radius)
        if (x < sx - radius) return
        if (x > sx + radius) return
        if (y < sy - radius) return
        if (y > sy + radius) return
        overItem = index
      })

      return overItem
    }

    const handleMouseMove = (e) => {
      const backgroundDiv = backgroundRef.current;
      if (!backgroundDiv) return;

      const rect = backgroundDiv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      //console.log([x, y]);

      const overItem = isOverItem(x,y)
      if (overItem != null) {
        setCurrentCursor('pointer')
        return
      }
      const inDoor = isOverDoor(x,y)
      if (inDoor != null) {
        setCurrentCursor('help')
        return
      }   
    }

    const handleMouseClick = (e) => {
      const backgroundDiv = backgroundRef.current
      if (!backgroundDiv) return

      if (e.button === 2) {
        setRmb(true)
        return
      }

      const rect = backgroundDiv.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let action = null

      const inDoor = isOverDoor(x,y)
      if (inDoor != null) {
        const door = levelData[level].doors[inDoor]
        const dest = [parseInt(door.x), parseInt(door.z)]
        setPlayerDestination(dest)
        //console.log(dest, door.destination)

        action = {
          type: "door",
          destination: door.destination,
          coord: dest,
          key: door.key,
          index: inDoor
        }
      }

      const overItem = isOverItem(x,y)
      if (overItem != null) {
        const item = levelData[level].zones[zone].items[overItem]
        const dest = [parseInt(item.x), parseInt(item.z)]
        setPlayerDestination(dest)

        action = {
          type: "item",
          index: overItem,
          coord: dest,
        }
      }

      setDestinationAction(action)
    }

    const handleMouseUp = (e) => {
      if (e.button === 2) {
        setRmb(false)
        setShotCharge(0)
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseClick);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", (e) => e.preventDefault())
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleMouseClick);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", (e) => e.preventDefault());  
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelData, level])

  // Reached destination
  useEffect(() => {
    //console.log(destinationAction)
    if (destinationAction == null) {
      setReachedDestination(null)
      return
    }

    if (destinationAction.coord != reachedDestination) {
      setReachedDestination(null)
      setDestinationAction(null)
    }

    if (destinationAction.type == "door") {
      let travel = false
      const destination = destinationAction.destination
      if (destinationAction.key) {
        const containsItem = inventory.some(item => item.name === destination)
        if (containsItem) {
          travel = true
          const updatedInventory = inventory.filter(item => item.name !== destination)
          setInventory(updatedInventory)

          // Update levels
          const tempLevels = {...levelData}
          const door = tempLevels[level].doors[destinationAction.index]
          door.key = null
          setLevelData(tempLevels)
          
        } else {
          setDialog(["Locked"])
        }
      } else travel = true

      if (travel) {
        //console.log("Going to " + destination)
        loadLevel(destination)
      }
    }
    else if (destinationAction.type == "item") {
      // Update levels
      const tempLevels = {...levelData}
      const item = tempLevels[level].zones[zone].items[destinationAction.index]
      item.collected = true
      setLevelData(tempLevels)

      // Update inventory
      //console.log(item)
      const tempInventory = [...inventory]
      if (item.type == "key") {
        tempInventory.push({
          name: item.name,
          label: item.name + " key",
          type: item.type,
        })
      } else if (item.type == "healing") {
        tempInventory.push({
          name: item.name,
          label: item.name,
          type: item.type,
        })
      }
      setInventory(tempInventory)
    }

    setReachedDestination(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reachedDestination])

  // Camera shot
  useEffect(() => {
    if (takeShot > 0) {
      let volume = 0.25 * takeShot
      if (volume > 1) volume = 1
      cameraClickAudio.current.play()
      cameraClickAudio.current.volume = 0.33 * volume
    }
  }, [takeShot])

  // Play Audio
  useEffect(() => {
    if (playAudio == "PlayerHurt") {
      femaleHurtAudio.current.play()
    }
    else if (playAudio == "DroneGrowl") {
      droneGrowlAudio.current.play()
    }
  }, [playAudio])

  if (level == null) {
    loadLevel("a")
    return (
      <div style={{cursor: currentCursor}}>
        <button onClick={()=>loadLevel("a")}>
          New Game
        </button>
        <button>Load 1</button>
      </div>
    )
  }

  const backgroundImg = level ? `url(./levels/${level}${zone}.png)` : ''
  
  return (
    <div className="game">
      <div>

        <div 
          ref={backgroundRef}
          className="background"
          style={{ backgroundImage: backgroundImg }}
        />

        { levelData[level]?.zones[zone]?.items && levelData[level].zones[zone].items.map( (item, index) => (
          !item.collected && <img key={index} src={"./items/" + item.image} className="item" style={{top: item.sy - 28 + "px", left: item.sx -28 + "px"}} />
        ))
        }

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
              <Arena
                levelData={levelData}
                setLevelData={setLevelData} 
                level={level} 
                zone={zone}
                levelDoor={levelDoor} 
                playerDestination={playerDestination} 
                setPlayerDestination={setPlayerDestination} 
                setReachedDestination={setReachedDestination}
                setCurrentCursor={setCurrentCursor}
                rmb={rmb}
                takeShot={takeShot}
                setTakeShot={setTakeShot}
                setShotCharge={setShotCharge}
                setPhotoImg={setPhotoImg}
                setPlayAudio={setPlayAudio}                
              />
            </Suspense>
          </Canvas>
        </KeyboardControls>

        {dialog.length > 0 && <DialogUi dialog={dialog} setDialog={setDialog} />}

      </div>

      <SideBar />

      <audio
        id="bgMusic"
        src='./audio/creepy-music.wav'
        loop
        autoPlay={false}
      />

      <audio
        ref={cameraClickAudio}
        id="cameraClickAudio"
        src='./audio/click.wav'
      />

      <audio
        ref={femaleHurtAudio}
        id="femaleHurtAudio"
        src='./audio/f-hurt.ogg'
      />

      <audio
        ref={droneGrowlAudio}
        id="droneGrowlAudio"
        src='./audio/zombie-growl.wav'
      />
    
    </div>
  )
}

export default Game