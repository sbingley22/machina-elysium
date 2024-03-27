/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three'

const GridHelper = ({ grid, gridScale, setGrid, setNodeInfo, brush }) => {
  const gridX = grid.width
  const gridZ = grid.height
  const temp = new THREE.Object3D()
  const instancedMeshRef = useRef()

  const [drawMode, setDrawMode] = useState(false)

  useEffect(() => {
    if (!grid) return

    // Set position
    for (let x = 0; x < gridX; x++) {
      for (let z = 0; z < gridZ; z++) {
        const newX = x * gridScale
        const newZ = -z * gridScale
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
    instancedMeshRef.current.material.opacity = 0.5;
    instancedMeshRef.current.material.transparent = true;
    //console.log(instancedMeshRef.current)
    //console.log(grid)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid])

  const handleMouseDraw = (e) => {
    const pointX = e.point.x
    const pointZ = e.point.z
    
    // convert point to grid index then update grid
    const gridX = Math.round( (pointX / gridScale) + grid.width/2 )
    const gridZ = Math.round( (pointZ / gridScale) + grid.height/2 )
    setNodeInfo([gridX,gridZ])
    
    if (!drawMode) return

    const tempGrid = {...grid}
    const node = tempGrid.nodes[gridZ][gridX]
    if (brush == "walk") {
      if (node.walkable == false) {
        node.walkable = true
        setGrid(tempGrid)
      }
    } else if (brush == "block") {
      if (node.walkable == true) {
        node.walkable = false
        setGrid(tempGrid)
      }
    }
  }

  const handleMouseDown = () => {
    setDrawMode(true);
  };

  const handleMouseUp = () => {
    setDrawMode(false);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  return (
    <group 
      position={[
        gridScale/2, 
        0, 
        -gridScale/2]}
    >
      <instancedMesh 
        ref={instancedMeshRef} 
        args={[null, null, gridX*gridZ]}
        onPointerMove={handleMouseDraw}
        onPointerDown={handleMouseDown}
      >
        <planeGeometry />
        <meshPhongMaterial />
      </instancedMesh>
    </group>
  )
}

export default GridHelper