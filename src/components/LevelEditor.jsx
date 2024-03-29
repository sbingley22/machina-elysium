/* eslint-disable react/no-unknown-property */
import { Box, useGLTF } from '@react-three/drei'
import levelGlb from '../assets/Levels.glb?url'
import levelJson from '../assets/levels.json'
import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import GridHelper from './GridHelper'
import Pathfinding from 'pathfinding'
import LevelCamera from './LevelCamera'

const gridScale = 0.5

const LevelEditor = () => {
  const { nodes } = useGLTF(levelGlb)

  const [levelData, setLevelData] = useState(levelJson)
  const [level, setLevel] = useState("a")
  const [zone, setZone] = useState(0)
  const [name, setName] = useState("")
  
  const [nodeInfo, setNodeInfo] = useState([-1,-1])
  const [screenInfo, setScreenInfo] = useState([-1,-1])
  const [brush, setBrush] = useState("walk")
  const [camZone, setCamZone] = useState([])
  const [otherCamZones, setOtherCamZones] = useState([])

  const backgroundRef = useRef()
  const backgroundImg = `url(./levels/${level}${zone}.png)`

  const [grid, setGrid] = useState(null)
  const [gridSize, setGridSize] = useState([10,10])
  const [camObject, setCamObject] = useState(null)

  const loadCamera = () => {
    const camKey = Object.keys(nodes).find(key => key.startsWith(`${level}-${zone}-Cam`))
    const camObj = nodes[camKey]
    setCamObject(camObj)
  }

  const gridToWorld = (gridPos) => {
    const gX = gridPos[0]
    const gZ = gridPos[1]
    const wX = (gX * gridScale) + (gridScale/2)
    const wZ = ((gZ * gridScale) + (gridScale/2)) *-1
    return [wX, wZ]
  }

  // Mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      const backgroundDiv = backgroundRef.current
      if (!backgroundDiv) return
  
      const rect = backgroundDiv.getBoundingClientRect()
      const x = Math.round(e.clientX - rect.left)
      const y = Math.round(e.clientY - rect.top)
      setScreenInfo(`x: ${x}, y: ${y}`)
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Log nodes
  useEffect(()=>{
    console.log(nodes)
  }, [nodes])
  
  // Level change
  useEffect(()=>{
    setZone(0)

    // Load level data
    const lvl = levelData[level]

    // Grid
    const gridWidth = lvl.grid?.size?.[0] ?? 10
    const gridHeight = lvl.grid?.size?.[1] ?? 10
    setGridSize([gridWidth, gridHeight])

    const tempGrid = new Pathfinding.Grid(gridWidth, gridHeight)

    // Load in walkable values from json
    if (lvl.grid && lvl.grid.walkable) {
      lvl.grid.walkable.forEach((nodeIndex) => {
        const x = nodeIndex % tempGrid.width
        const z = Math.floor(nodeIndex / tempGrid.width)
        tempGrid.nodes[z][x].walkable = false
      })
    }

    setGrid(tempGrid)

    // Name
    const levelName = lvl.name ? lvl.name : ''
    setName(levelName)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, levelData])

  // Load zone
  useEffect(()=>{
    loadCamera()

    const lvl = levelData[level]

    // Camera zone
    const camZones = lvl.zones[zone]?.zoneSquares ? lvl.zones[zone].zoneSquares : []
    setCamZone(camZones)

    // Other cam zones
    const allCamZones = lvl.zones? lvl.zones : []
    let concatenatedCamZones = allCamZones
      .filter((_, index) => index !== zone)
      .reduce((acc, obj) => acc.concat(obj.zoneSquares), [])
    setOtherCamZones(concatenatedCamZones)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, levelData, zone])

  const changeBrushMode = () => {
    if (brush == "walk") setBrush("zone")
    else if (brush == "zone") setBrush("walk")
  }

  const updateGrid = () => {
    const tempGrid = new Pathfinding.Grid(gridSize[0], gridSize[1])
    setGrid(tempGrid)
  }

  // Translate walkable squares to single array
  const getWalkableArray = () => {
    const walkableArray = []
    for (let x = 0; x < grid.width; x++) {
      for (let z = 0; z < grid.height; z++) {
        const node = grid.nodes[z][x];
        const index = x + grid.width * z
        if (node.walkable == false) walkableArray.push(index)
      }
    }
    return walkableArray
  }

  const logLevel = () => {
    const lvl = levelData[level]
    const zones = lvl.zones ? lvl.zones : []

    const loggedLevel = {
      name: name,
      grid: {
        size: gridSize,
        walkable: getWalkableArray()
      },
      zones: zones
    }

    const thisZone = {
      //camera: camObject,
      zoneSquares: camZone
    }
    loggedLevel.zones[zone] = thisZone

    console.log(loggedLevel)
  }
  
  // Box
  const boxWorld = gridToWorld([2,2])
  const boxPos = [boxWorld[0], 0.5, boxWorld[1]]
  const boxVisible = false

  return (
    <div className='game'>
      <div>
        <div
          className="background"
          style={{ backgroundImage: backgroundImg}}
          ref={backgroundRef}
        />

        { levelData[level]?.zones[zone]?.items && levelData[level].zones[zone].items.map( (item, index) => (
          !item.collected && <img key={item.name + index} src={"./items/" + item.image} className="item" style={{top: item.sy - 28 + "px", left: item.sx -28 + "px"}} />
        ))
        }

        <Canvas
          style={{width: "100%", height: "100%"}}
        >
          <ambientLight intensity={1} />
          <directionalLight position={[0,1,0]} castShadow/>
          <LevelCamera camObject={camObject} />

          { grid && 
            <GridHelper 
              grid={grid} 
              gridScale={gridScale} 
              setGrid={setGrid} 
              setNodeInfo={setNodeInfo} 
              brush={brush}
              camZone={camZone}
              setCamZone={setCamZone}
              otherCamZones={otherCamZones}
            />
          }

          <Box position={boxPos} scale={[0.25,1,0.25]} visible={boxVisible} />
        
        </Canvas>

      </div>

      <div style={{textAlign: "left", padding: "15px"}}>
        <div>
          <select onChange={(e) => setLevel(e.target.value)}>
            {Object.keys(levelData).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          <select onChange={(e) => setZone(parseInt(e.target.value))}>
            {levelData[level].zones.map((zone, index) => (
              <option key={"zone"+index} value={index}>{index}</option>
            ))}
          </select>
        </div>
        <div>
          <p>Level: {name}</p>
          <p>Screen Pos {screenInfo}</p>
          <p>Grid: {nodeInfo[0]} : {nodeInfo[1]}</p>
          <button onClick={changeBrushMode}>{brush}</button>
        </div>
        <div>
          <input
            className='small'
            type="number"
            value={gridSize[0]}
            onChange={(e) => setGridSize([parseInt(e.target.value), gridSize[1]])}
          />
          <input
            className='small'
            type="number"
            value={gridSize[1]}
            onChange={(e) => setGridSize([gridSize[0], parseInt(e.target.value)])}
          />
          <button onClick={updateGrid}>Update Grid</button>
        </div>
        <div>
          <button onClick={logLevel}>Log Level</button>
        </div>
      </div>
    </div>
  )
}

export default LevelEditor

useGLTF.preload(levelGlb)