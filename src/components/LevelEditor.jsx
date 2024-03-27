/* eslint-disable react/no-unknown-property */
import { useGLTF } from '@react-three/drei'
import levelGlb from '../assets/Levels.glb?url'
import levelJson from '../assets/levels.json'
import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import GridHelper from './GridHelper'
import Pathfinding from 'pathfinding'
import LevelCamera from './LevelCamera'

const gridScale = 0.5

const LevelEditor = () => {
  const { nodes } = useGLTF(levelGlb)

  const [levelData, setLevelData] = useState(levelJson)
  const [level, setLevel] = useState("a")
  const [zone, setZone] = useState(0)
  
  const [nodeInfo, setNodeInfo] = useState(null)
  const [screenInfo, setScreenInfo] = useState(null)
  const [brush, setBrush] = useState("walk")

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

    // Camera
    loadCamera()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, levelData])

  return (
    <div className='game'>
      <div>
        <div
          className="background"
          style={{ backgroundImage: backgroundImg}}
          ref={backgroundRef}
        />
        <Canvas
          style={{width: "100%", height: "100%"}}
        >
          <ambientLight intensity={1} />
          <directionalLight position={[0,1,0]} castShadow/>
          <LevelCamera camObject={camObject} />

          { grid && <GridHelper grid={grid} gridScale={gridScale} setGrid={setGrid} setNodeInfo={setNodeInfo} brush={brush} /> }
        </Canvas>
      </div>
      <div>
        <select onChange={(e) => setLevel(e.target.value)}>
          {Object.keys(levelData).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <select onChange={(e) => setZone(e.target.value)}>
          {levelData[level].zones.map((zone, index) => (
            <option key={"zone"+index} value={index}>{index}</option>
          ))}
        </select>
        <p>{levelData?.[level]?.name ? levelData?.[level]?.name : ''}</p>
      </div>
    </div>
  )
}

export default LevelEditor

useGLTF.preload(levelGlb)