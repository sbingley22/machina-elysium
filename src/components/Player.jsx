/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */
import { useAnimations, useGLTF } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import modelGlb from '../assets/Eve.glb?url'
import * as THREE from 'three'
import { useSkinnedMeshClone } from './SkinnedMeshClone'

const vec3Pos = new THREE.Vector3()
const vec3Dir = new THREE.Vector3()

const Player = ({ playerPos, playerDestination, setReachedDestination, grid, gridScale, gridToWorld, worldToGrid, findPath, setZone, zoneSquares, xMode, rmb, setTakeShot, setShotCharge, setPlayerStatus, setPlayAudio }) => {
  const group = useRef()
  const { scene, nodes, animations, materials } = useSkinnedMeshClone(modelGlb)
  // eslint-disable-next-line no-unused-vars
  const { actions, names, mixer } = useAnimations(animations, scene) // scene must be added to useAnimations()
  //console.log(nodes)
  const skin = useRef("Healthy")

  // Initialise nodes
  useEffect(() => {
    console.log(nodes, materials, names)

    let nodeArray = ["Eve", "EveGen"]
    nodeArray.forEach(node => {
      if (nodes[node]) nodes[node].castShadow = true
    })

    nodeArray = ["Plane"]
    nodeArray.forEach(node => {
      if (nodes[node]) nodes[node].visible = false
    })

    let node = "EveGen"
    if (xMode == 1) node = "Eve"
    if (nodes[node]) nodes[node].visible = false

    nodeArray = ["Eve", "EveGen"]
    nodeArray.forEach(node => {
      if (nodes[node] && xMode == 1) nodes[node].material = materials.EveSkin
    })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes])

  const currentAnimation = useRef("Idle")
  const nextAnimation = useRef("Idle")
  const [ path, setPath ] = useState([])
  const action = useRef(null)
  const actionTimer = useRef(0)

  const updateAnimation = () => {
    if (!actions) return
    if (!nextAnimation.current) return
    actions[currentAnimation.current].fadeOut(0.5)
    actions[nextAnimation.current].reset().fadeIn(0.5).play()

    currentAnimation.current = nextAnimation.current
    nextAnimation.current = null

    //console.log(mixer)
    //console.log(actions)
    //console.log(currentAnimation.current)
  }

  const rotateTo = (targetPosition) => {
    vec3Dir.subVectors(targetPosition, group.current.position).normalize()
    const targetRotation = Math.atan2(vec3Dir.x, vec3Dir.z)
    group.current.rotation.y = targetRotation
  }

  const move = (delta) => {
    if (rmb) return

    if (path.length == 1) {
      if (currentAnimation.current == "Jogging") nextAnimation.current = "Idle"
      setReachedDestination(path[0])
      const newPath = [...path.slice(1)]
      setPath(newPath)
      return
    }
    else if (path.length < 1) {
      return
    }

    //console.log(path)

    if (currentAnimation.current !== "Jogging") nextAnimation.current = "Jogging"

    const worldNode = gridToWorld([path[0][0], path[0][1]], gridScale)
    vec3Pos.set(worldNode[0],0,worldNode[1])
    const position = group.current.position
    const distance = position.distanceTo(vec3Pos)
    //console.log(position)

    if (distance < 0.1) {
      if (path.length < 2) setReachedDestination(path[0])

      // Check if grid square is a zone square
      const pathIndex = path[0][0] * grid.height + path[0][1]
      let transitionIndex = -1
      zoneSquares.forEach( (zs, index) => {
        if (transitionIndex != -1) return

        zs.forEach( s => {
          if (s == pathIndex) {
            transitionIndex = index
            console.log("Changing to Zone: " + index)
            return
          }
        })
      })
      if (transitionIndex != -1) setZone(transitionIndex)

      const newPath = [...path.slice(1)]
      setPath(newPath)
      return
    }

    // Update position
    const speed = 3.5 * delta
    vec3Dir.subVectors(vec3Pos, position).normalize()
    position.addScaledVector(vec3Dir, speed)
    //console.log(vec3Dir)

    // Calculate rotation
    const targetRotation = Math.atan2(vec3Dir.x, vec3Dir.z);
    let currentRotation = group.current.rotation.y;

    // Ensure shortest rotation
    const PI2 = Math.PI * 2;
    const diff = (targetRotation - currentRotation + Math.PI) % PI2 - Math.PI;
    const rotationDirection = Math.sign(diff);

    // Smoothly interpolate rotation
    const rotationSpeed = 10
    const deltaRotation = rotationSpeed * delta
    let newRotation = currentRotation
    if (Math.abs(diff) > deltaRotation) {
      newRotation = currentRotation + rotationDirection * deltaRotation
    } else {
      newRotation = targetRotation;
    }
    group.current.rotation.y = newRotation;
  }

  const updateActions = (delta) => {
    if (rmb) {
      //console.log("right mouse held")
      if (path.length > 0) setPath([])
      
      if (action.current === "PalmShoot") {
        actionTimer.current += delta * 1.4
        const timerFloor = Math.floor(actionTimer.current)
        setShotCharge(prev => {
          if (timerFloor === prev) return prev
          return timerFloor
        })

        // Rotate to face enemy
        if (group.current.rotationFlag) {
          //console.log("Rotate to", group.current.rotationFlag)
          rotateTo(group.current.rotationFlag)
          group.current.rotationFlag = null
        }
      }
      else {
        action.current = "PalmShoot"
        nextAnimation.current = "PalmShoot"
        //console.log(nextAnimation.current)
      }
    } else {
      if (action.current === "PalmShoot") {
        // take photo
        setTakeShot(actionTimer.current)
        action.current = null
        actionTimer.current = 0
        nextAnimation.current = "Idle"
      }
    }

    // Action flags
    const actionFlag = group.current.actionFlag
    //console.log(actionFlag)

    if (actionFlag === "Take Damage") {
      if (currentAnimation.current === "Take Damage") return
      nextAnimation.current = "Take Damage"
      actionTimer.current = 0
      setShotCharge(0)
      group.current.actionFlag = null

      // Reduce health
      group.current.health -= 15
      if (group.current.health < 0) {
        group.current.actionFlag = "Player Dead"
      } else if (group.current.health > 100) group.current.health = 100

      setPlayAudio("PlayerHurt")
    }
  }

  const updateModel = () => {
    let currentSkin = "Healthy"
    if (group.current.health < 33) {
      currentSkin = "D2"
    } else if (group.current.health < 66) {
      currentSkin = "D1"
    }

    if (currentSkin != skin.current) {
      // Update materials
      setPlayerStatus(currentSkin)
      let node = "Eve"

      //console.log(nodes[node], materials.EveSwimsuitD1)

      if (xMode == 1) {
        node = "EveGen"
        if (nodes[node]) {
          if (currentSkin == "Healthy") {
            nodes[node].material = materials.EveSkin
          } else if (currentSkin == "D1") {
            nodes[node].material = materials.EveSkinD1
          } else if (currentSkin == "D2") {
            nodes[node].material = materials.EveSkinD2
          }
        }
      } else {
        if (nodes[node]) {
          if (currentSkin == "Healthy") {
            nodes[node].material = materials.EveSwimsuit
          } else if (currentSkin == "D1") {
            nodes[node].material = materials.EveSwimsuitD1
          } else if (currentSkin == "D2") {
            nodes[node].material = materials.EveSwimsuitD2
          }
        }
      }

      skin.current = currentSkin
    }
  }

  // Player wants to move
  useEffect(() => {
    if (playerDestination[0] == -1) return

    const worldPos = group.current.position
    const gridPos = worldToGrid([worldPos.x, worldPos.z], gridScale)
    //console.log(worldPos, gridPos)

    const newPath = findPath([gridPos[0], gridPos[1]], playerDestination, grid)
    //console.log("Player Destination Use Effect:", newPath)
    setPath(newPath)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerDestination])

  // Mixer functions. Listen for animation end, etc.
  useEffect(() => {
    actions['Take Damage'].repetitions = 1
    actions['Take Damage'].clampWhenFinished = true
    actions['Claw'].repetitions = 1
    actions['Claw'].clampWhenFinished = true

    // eslint-disable-next-line no-unused-vars
    mixer.addEventListener('finished', (e) => {
      nextAnimation.current = "Idle"
    })

    return () => mixer.removeEventListener('finished')
  }, [mixer, actions])

  // eslint-disable-next-line no-unused-vars
  useFrame((state, delta) => {
    if (!scene) return

    updateActions(delta)
    move(delta)
    updateAnimation()
    updateModel()
  })

  return (
    <group 
      ref={group}
      position={[playerPos[0],0,playerPos[2]]}
      dispose={null}
      name='Player'
      health={100}
      actionFlag={null}
      rotationFlag={null}
    >
      <primitive object={scene} />
    </group>
  )
}

export default Player

useGLTF.preload(modelGlb)