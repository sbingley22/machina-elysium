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

const Enemy = ({ id, type, status, initialPos, grid, gridScale, gridToWorld, worldToGrid, findPath, xMode, pointerOverEnemy, setPlayAudio }) => {
  const group = useRef()
  const { scene, nodes, animations, materials } = useSkinnedMeshClone(modelGlb)
  const { actions, mixer } = useAnimations(animations, scene) // scene must be added to useAnimations()

  // Initialise nodes
  useEffect(() => {
    //console.log(nodes, names)

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
      if (nodes[node]) nodes[node].material = materials.EveEvil
    })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes])

  const playerRef = useRef(null)
  const currentAnimation = useRef("Idle")
  const nextAnimation = useRef("Idle")
  const [ path, setPath ] = useState([])
  const [ dead, setDead ] = useState(false)
  const frameCount = useRef(0)

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

  const move = (delta) => {
    if (currentAnimation.current == "Claw") return
    if (currentAnimation.current == "Take Damage") return
    if (path.length == 1) {
      if (currentAnimation.current == "Staggering") nextAnimation.current = "Staggering"
      const newPath = [...path.slice(1)]
      setPath(newPath)
      return
    }
    else if (path.length < 1) {
      return
    }

    if (currentAnimation.current !== "Staggering") nextAnimation.current = "Staggering"

    const worldNode = gridToWorld([path[0][0], path[0][1]], gridScale)
    vec3Pos.set(worldNode[0],0,worldNode[1])
    const position = group.current.position
    const distance = position.distanceTo(vec3Pos)
    //console.log(position)

    if (distance < 0.1) {
      const newPath = [...path.slice(1)]
      setPath(newPath)
      return
    }

    // Update position
    const speed = 0.8 * delta
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

  const updateActions = () => {
    const health = group.current.health
    if (health <= 0) {
      setDead(true)
    }

    // Attack player?
    const distance = playerRef.current.position.distanceTo(group.current.position)
    if (distance < 1.2 && currentAnimation.current != "Claw") {
      //console.log(distance)
      group.current.actionFlag = "Claw"
      playerRef.current.actionFlag = "Take Damage"
    }

    // Random growl
    if (Math.random() < 1/200) setPlayAudio("DroneGrowl")

    // Sort action flags
    const actionFlag = group.current.actionFlag
    if (actionFlag == "") return
    //console.log(actionFlag)

    if (actionFlag == "Take Damage") {
      nextAnimation.current = "Take Damage"
      group.current.actionFlag = ""
    }
    else if (actionFlag == "Claw") {
      nextAnimation.current = "Claw"
      group.current.actionFlag = ""
    }
  }

  const updatePath = () => {
    if (!group.current) return
    if (currentAnimation.current == "Claw") return
    if (currentAnimation.current == "Take Damage") return

    const worldPos = group.current.position
    const gridPos = worldToGrid([worldPos.x, worldPos.z], gridScale)
    //console.log(worldPos, gridPos)

    const playerPosVec = playerRef.current.position
    const playerGrid = worldToGrid([playerPosVec.x, playerPosVec.z], gridScale)
    //console.log(gridPos, playerGrid)
    const newPath = findPath(gridPos, playerGrid, grid)
    //console.log(newPath)
    setPath(newPath)
  }

  // Mixer functions. Listen for animation end, etc.
  useEffect(() => {
    actions['Take Damage'].repetitions = 1
    actions['Take Damage'].clampWhenFinished = true
    actions['Claw'].repetitions = 1
    actions['Claw'].clampWhenFinished = true

    // eslint-disable-next-line no-unused-vars
    mixer.addEventListener('finished', (e) => {
      //console.log(e)
      nextAnimation.current = "Idle"
    })

    return () => mixer.removeEventListener('finished')
  }, [mixer, actions])

  useEffect(()=>{
    if (status == 0) {
      // Set enemy to dead
      actions["KO"].reset().play()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // eslint-disable-next-line no-unused-vars
  useFrame((state, delta) => {
    if (!scene) return
    if (dead) return
    if (group.current.actionFlag == "Player Dead") return
    if (status == 0) return

    // find player
    if (!playerRef.current) {
      // find reference to player
      const sceneChildren = state.scene.children
      sceneChildren.forEach((node) => {
        if (node.name === "Player") {
          playerRef.current = node
          //console.log(playerRef.current)
        }
      })
    }

    frameCount.current += 1

    updateActions()
    move(delta)
    if (frameCount.current % 10 == 0) updatePath()
    updateAnimation()
  })

  const handlePointerOver = () => {
    pointerOverEnemy(group.current.position)
    //console.log("Pointer over enemy")
  }

  return (
    <group 
      ref={group}
      position={initialPos}
      dispose={null}
      name={type+id}
      health={100}
      actionFlag={""}
      onPointerOver={handlePointerOver}
    >
      <primitive object={scene} />
    </group>
  )
}

export default Enemy

useGLTF.preload(modelGlb)