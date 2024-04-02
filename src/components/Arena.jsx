/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
import * as THREE from 'three'
import { useThree } from "@react-three/fiber"
import { useEffect, useState } from "react"
import Pathfinding from 'pathfinding'
import { useRef } from 'react'
// eslint-disable-next-line no-unused-vars
import GridVisualiser from './GridVisualiser'
import { useGLTF } from '@react-three/drei'
import levelGlb from '../assets/Levels.glb?url'
import LevelCamera from './LevelCamera'
import GridGame from './GridGame'
import Player from './Player'
import Enemy from './Enemy'

const screenPosition = new THREE.Vector3()
const worldPosition = new THREE.Vector3()
const gridScale = 0.5

const Arena = ({ 
    levelData, 
    setLevelData,
    level, 
    zone, 
    setZone,
    levelDoor, 
    xMode,
    playerDestination, 
    setPlayerDestination, 
    setReachedDestination,
    setCurrentCursor,
    playerFlag,
    rmb, 
    takeShot, 
    setTakeShot, 
    setShotCharge,
    setPlayerStatus, 
    setPhotoImg, 
    setPlayAudio 
  }) => {

  const { scene, camera, mouse } = useThree()
  const { nodes: levelNodes } = useGLTF(levelGlb)
  const [camObject, setCamObject] = useState(null)

  const [grid, setGrid] = useState(null)
  const [zoneSquares, setZoneSquares] = useState(null)
  const [gridClick, setGridClick] = useState([-1,-1])

  const playerRef = useRef(null)
  const [enemies, setEnemies] = useState([])
  const [playerPos, setPlayerPos] = useState([0,0,0])

  const loadCamera = () => {
    const camKey = Object.keys(levelNodes).find(key => key.startsWith(`${level}-${zone}-Cam`))
    const camObj = levelNodes[camKey]
    setCamObject(camObj)
  }

  // Load level
  useEffect(() => {
    if (levelData == null) return
    if (level == null) return

    const lvl = levelData[level]
    //console.log(lvl)
    
    // Create new grid
    const gridWidth = lvl.grid.size[0]
    const gridHeight = lvl.grid.size[1]
    const tempGrid = new Pathfinding.Grid(gridWidth, gridHeight)
    //console.log(tempGrid)

    // Load in walkable values from json
    lvl.grid.walkable.forEach((nodeIndex) => {
      const x = nodeIndex % tempGrid.width
      const z = Math.floor(nodeIndex / tempGrid.width)
      tempGrid.nodes[z][x].walkable = false
    })    
    setGrid(tempGrid)
    //console.log(lvl.grid.walkable)

    // Load zone squares
    const tempZoneSquares = []
    lvl.zones.forEach( zone => {
      tempZoneSquares.push(zone.zoneSquares)
    })
    setZoneSquares(tempZoneSquares)
    //console.log(tempZoneSquares)
    
    // Load camera
    loadCamera()

    // Load player
    const door = lvl.zones[zone].doors.find(door => door.destination === levelDoor)
    if (!door) console.log("Couldn't find door")
    const doorPos = gridToWorld([parseInt(door.x), parseInt(door.z)], gridScale)
    setPlayerPos([doorPos[0], 0, doorPos[1]])
    //console.log(door, doorPos)

    // Load enemies
    const enemyData = lvl.enemies
    if (enemyData) {
      const tempEnemies = []
      enemyData.forEach((en, index) => {
        const enemyPos = gridToWorld([parseInt(en.x), parseInt(en.z)], gridScale)
        //console.log(en.x, en.z, enemyPos)
        tempEnemies.push({
          id: index,
          gx: enemyPos[0],
          gz: enemyPos[1],
          type: en.type,
          health: 100,
          status: en.status
        })
      })
      setEnemies(tempEnemies)
      //console.log(tempEnemies)
    } else setEnemies([])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, levelDoor])

  // Zone change
  useEffect(()=>{
    loadCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone])
  
  // Pathfinding
  const finder = new Pathfinding.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: true,
  })

  const findPath = (start, end, grid) => {
    const gridClone = grid.clone()
    
    if (start[0] < 0 || start[1] < 0) return []
    if (start[0] > grid.width || start[1] > grid.height) return []
    if (end[0] < 0 || end[1] < 0) return []
    if (end[0] > grid.width || end[1] > grid.height) return []
    //console.log(start, end)
    
    gridClone.setWalkableAt(start[0], start[1], true)
    const path = finder.findPath(start[0], start[1], end[0], end[1], gridClone)
    path.shift()
    return path
  }

  const gridToWorld = (gridPos, gridScale) => {
    const gX = gridPos[0]
    const gZ = gridPos[1]
    const wX = (gX * gridScale) + (gridScale/2)
    const wZ = ((gZ * gridScale) + (gridScale/2)) *-1
    return [wX, wZ]
  }

  const worldToGrid = (worldPos, gridScale) => {
    const wX = worldPos[0]
    const wZ = worldPos[1]
    const gX = Math.floor(wX / gridScale)
    const gZ = Math.floor((wZ * -1) / gridScale)
    return [gX, gZ];
  }

  const findNodeByName = (node, name) => {
    if (node.name === name) {
      return node
    }

    if (node.children && node.children.length > 0) {
      for (let child of node.children) {
        const foundNode = findNodeByName(child, name)
        if (foundNode) {
          return foundNode
        }
      }
    }

    return null
  }

  const getMousePos = () => {
    return {x: mouse.x, y: mouse.y}
  }

  const worldToScreen = (worldPos) => {
    worldPosition.copy(worldPos)
    worldPosition.y += 1
    screenPosition.copy(worldPosition).project(camera);

    return screenPosition;
  }

  const pointerOverEnemy = (position) => {
    if (!playerRef.current) return
    playerRef.current.rotationFlag = position
    //console.log("pointer rotation: ", position)
  }

  // Get player ref
  useEffect(()=>{
    const ply = findNodeByName(scene, "Player")
    playerRef.current = ply
    //console.log(ply)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerPos])

  // Move to grid pos
  useEffect(()=>{
    if (gridClick[0] == -1) return

    // Check if grid position is walkable
    const node = grid.nodes[gridClick[1]][gridClick[0]]
    if (node.walkable == false) return
    //console.log(node)

    setPlayerDestination(gridClick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridClick])

  // Take a photo
  useEffect(()=>{
    if (takeShot == -1) return

    let shotPower = Math.floor(takeShot)
    if (shotPower > 3) shotPower = 3

    let hitEnemy = false

    enemies.forEach( (en, index) => {
      const enemy = findNodeByName(scene, en.type+en.id)
      //console.log(enemy)
      const mousePos = getMousePos()
      //console.log(mousePos)      
      const screenPos = worldToScreen(enemy.position)
      //console.log(screenPos)

      const radius = .15

      if (mousePos.x < screenPos.x - radius) return
      if (mousePos.x > screenPos.x + radius) return
      if (mousePos.y < screenPos.y - radius) return
      if (mousePos.y > screenPos.y + radius) return

      // hit enemy
      hitEnemy = true

      enemy.health -= shotPower * 20
      enemy.actionFlag = "Take Damage"

      // is enemy dead
      if (enemy.health < 0) {
        // Update levels
        const tempLevels = {...levelData}
        const enemy = tempLevels[level].enemies[index]
        enemy.status = 0
        setLevelData(tempLevels)
      }
    })

    if (hitEnemy) {
      setPhotoImg(prev => {
        if (prev == "DollPhoto1") return "DollPhoto2"
        if (prev == "DollPhoto2") return "DollPhoto3"
        return "DollPhoto1"
      })
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[takeShot])  

  // Update player flag
  useEffect(()=>{
    if (playerFlag.action == "respawn") {
      playerRef.current.health = 100
    }
  }, [playerFlag])

  
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[0,10,0]} 
        castShadow
        shadow-camera-left={0}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={0}
      />

      <LevelCamera camObject={camObject} />

      <Player 
        playerPos={playerPos}
        playerDestination={playerDestination}
        setReachedDestination={setReachedDestination}
        grid={grid}
        gridScale={gridScale}
        gridToWorld={gridToWorld}
        worldToGrid={worldToGrid}
        findPath={findPath}
        setZone={setZone}
        zoneSquares={zoneSquares}
        xMode={xMode}
        playerFlag={playerFlag}
        rmb={rmb}
        setTakeShot={setTakeShot}
        setShotCharge={setShotCharge}
        setPlayerStatus={setPlayerStatus}
        setPlayAudio={setPlayAudio}      
      />

      {enemies.map( en => (
        <Enemy
          key={en.id}
          id={en.id}
          type={en.type}
          status={en.status}
          initialPos={[en.gx,0,en.gz]}
          grid={grid}
          gridScale={gridScale}
          gridToWorld={gridToWorld}
          worldToGrid={worldToGrid}
          findPath={findPath}
          pointerOverEnemy={pointerOverEnemy}
          xMode={xMode}
          setPlayAudio={setPlayAudio}
        />          
      ))}

      <GridGame grid={grid} gridScale={gridScale} setGridClick={setGridClick} setCurrentCursor={setCurrentCursor} />
      {/* <GridVisualiser grid={grid} gridScale={gridScale} /> */}
    </>
  )
}

export default Arena

useGLTF.preload(levelGlb)