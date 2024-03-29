/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */

import { useEffect, useRef } from 'react';
import * as THREE from 'three'

const GridVisualiser = ({ grid, gridScale }) => {
  const temp = new THREE.Object3D()
  const instancedMeshRef = useRef()  
  //console.log(grid)

  useEffect(() => {
    if (!grid) return

    const gridX = grid.width
    const gridZ = grid.height

    // Set position
    for (let x = 0; x < gridX; x++) {
      for (let z = 0; z < gridZ; z++) {
        const newX = x * gridScale
        const newZ = z * gridScale
        temp.position.set(newX, 0, newZ)
        temp.scale.set(gridScale * 0.95, gridScale * 0.95)
        temp.rotation.set(-Math.PI/2,0,0)
        temp.updateMatrix()
        const index = x * gridZ + z
        instancedMeshRef.current.setMatrixAt(index, temp.matrix)

        // set color based on walkable
        const isWalkable = grid.nodes[z][x].walkable
        let color = new THREE.Color('#AA0000')
        if (isWalkable) {
          color = new THREE.Color('#00AA00')
        }
        instancedMeshRef.current.setColorAt(index, color)
      }
    }
    // Update the instance
    instancedMeshRef.current.instanceMatrix.needsUpdate = true
    instancedMeshRef.current.instanceColor.needsUpdate = true
    instancedMeshRef.current.material.opacity = 0.25;
    instancedMeshRef.current.material.transparent = true;
  }, [grid, gridScale])

  if (!grid) return
  
  return (
    <group 
      position={[
        (grid.width*gridScale)*-0.5, 
        0, 
        (grid.height*gridScale)*-0.5]}
    >
      <instancedMesh 
        ref={instancedMeshRef} 
        args={[null, null, grid.width*grid.height]}
      >
        <planeGeometry />
        <meshPhongMaterial />
      </instancedMesh>
    </group>
  )
}

export default GridVisualiser