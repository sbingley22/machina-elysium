/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */
import { KeyboardControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense, useEffect, useRef, useState } from "react"
import SideBar from "./SideBar"
import levelsJson from '../assets/levels.json'
import Arena from "./Arena"
import DialogUi from "./DialogUi"
import { EffectComposer, Glitch, Pixelation } from "@react-three/postprocessing"

const Game = ({ xMode }) => {
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
  const [playerStatus, setPlayerStatus] = useState("Healthy")
  const [playerFlag, setPlayerFlag] = useState({
    action: "",
    value: 0
  })

  const [rmb, setRmb] = useState(false)
  const [takeShot, setTakeShot] = useState(-1)
  const [shotCharge, setShotCharge] = useState(0)
  const [photoImg, setPhotoImg] = useState("static")

  const [playAudio, setPlayAudio] = useState(null)
  const cameraClickAudio = useRef()
  const femaleHurtAudio = useRef()
  const droneGrowlAudio = useRef()

  // eslint-disable-next-line no-unused-vars
  const [pixelation, setPixelation] = useState(0)

  const loadLevel = (lvl, nextZone, manualDoor = false) => {
    if (level && !manualDoor) setLevelDoor(level)
    setZone(nextZone)
    setLevel(lvl)
  }  
  
  // Handle mouse move and click
  useEffect(() => {
    const isOverDoor = (x,y) => {
      const lvl = levelData[level].zones[zone]
      if (!lvl) return null
      if (!lvl.doors) return null

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
      const lvl = levelData[level].zones[zone]
      if (!lvl) return null

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

    const isOverInteractable = (x,y) => {
      const lvl = levelData[level].zones[zone]
      if (!lvl) return null

      let overInteractable = null
      if (!lvl.interactables) return null
      lvl.interactables.forEach( (interactable, index) => {
        const sx =  parseInt(interactable.sx)
        const sy =  parseInt(interactable.sy)
        const radius =  parseInt(interactable.radius)
        if (x < sx - radius) return
        if (x > sx + radius) return
        if (y < sy - radius) return
        if (y > sy + radius) return
        overInteractable = index
      })

      return overInteractable
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
      const overInteractable = isOverInteractable(x,y)
      if (overInteractable != null) {
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
      if (dialog.length > 0) return // Don't interact with level whilst dialog is present
      //console.log(dialog)

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
        const door = levelData[level].zones[zone].doors[inDoor]
        const dest = [parseInt(door.x), parseInt(door.z)]
        setPlayerDestination(dest)
        //console.log(dest, door.destination)

        action = {
          type: "door",
          destination: door.destination,
          nextZone: door.zone,
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

      const overInteractable = isOverInteractable(x,y)
      if (overInteractable != null) {
        const interactable = levelData[level].zones[zone].interactables[overInteractable]
        const dest = [parseInt(interactable.x), parseInt(interactable.z)]
        setPlayerDestination(dest)

        action = {
          type: "interactable",
          index: overInteractable,
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
  }, [levelData, level, zone, dialog])

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
      const nextZone = destinationAction.nextZone

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
        loadLevel(destination, nextZone)
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
    else if (destinationAction.type == "interactable") {
      // Display Dialog
      const interactable = levelData[level].zones[zone].interactables[destinationAction.index]
      setDialog(interactable.dialog)

      if (interactable.photo != null) {
        // Display photo

      }
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

      setShotCharge(0)
    }
  }, [takeShot])

  // Player Dead
  useEffect(()=>{
    if (playerStatus == "Dead") {
      setPlayerFlag({
        action: "respawn",
        value: 0
      })
      setLevelDoor("a")
      loadLevel("a", 0, true)
      setPlayerStatus("Healthy")
      setDialog(["Urrgh! Back again..."])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[playerStatus])

  // Initialise Audio
  useEffect(() => {
    femaleHurtAudio.current.volume = 0.2
  }, [])

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
    loadLevel("a", 0)
    return (
      <div>
        <button onClick={()=>loadLevel("a",0)}>
          New Game
        </button>
        <button>Load Game</button>
      </div>
    )
  }

  const backgroundImg = level ? `url(./levels/${level}${zone}.gif)` : ''
  
  return (
    <div className="game">
      <div>

        <div 
          ref={backgroundRef}
          className="background"
          style={{ backgroundImage: backgroundImg }}
        />

        { levelData[level]?.zones[zone]?.items && levelData[level].zones[zone].items.map( (item, index) => (
          !item.collected && 
            <img 
              key={index} 
              src={"./items/" + item.image} 
              className="item" 
              style={{top: item.sy - 28 + "px", left: item.sx -28 + "px", width: "56px"}}
            />
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
                setZone={setZone}
                levelDoor={levelDoor} 
                xMode={xMode}
                playerDestination={playerDestination} 
                setPlayerDestination={setPlayerDestination} 
                setReachedDestination={setReachedDestination}
                setCurrentCursor={setCurrentCursor}
                playerFlag={playerFlag}
                rmb={rmb}
                takeShot={takeShot}
                setTakeShot={setTakeShot}
                setShotCharge={setShotCharge}
                setPlayerStatus={setPlayerStatus}
                setPhotoImg={setPhotoImg}
                setPlayAudio={setPlayAudio}                
              />
            </Suspense>
            

            <EffectComposer>
              <Glitch
                delay={[0.1, 2.2]}
                duration={[0.1, 1.1]}
                strength={[0.1, 0.2]}
                active={playerStatus == "D2"}
              />
              <Pixelation granularity={pixelation} />
            </EffectComposer>

          </Canvas>

        </KeyboardControls>

        {dialog.length > 0 && <DialogUi dialog={dialog} setDialog={setDialog} />}

      </div>

      <SideBar 
        playerStatus={playerStatus} 
        xMode={xMode} 
        shotCharge={shotCharge} 
        photoImg={photoImg} 
        inventory={inventory} 
        setInventory={setInventory} 
        setPlayerFlag={setPlayerFlag}
      />

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