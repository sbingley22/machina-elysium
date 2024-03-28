/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three'

const GridHelper = ({ grid, gridScale, setGrid, setNodeInfo, brush, camZone, setCamZone, otherCamZones }) => {
  const gridX = grid.width
  const gridZ = grid.height
  const temp = new THREE.Object3D()
  const instancedMeshRef = useRef()

  const [drawMode, setDrawMode] = useState(false)
  const [mouseButton, setMouseButton] = useState(0)

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

    // Set cam zone colors
    camZone.forEach(cz => {
      instancedMeshRef.current.setColorAt(cz, new THREE.Color('#0000AA'))
    })
    // Set other cam zone colors
    otherCamZones.forEach(cz => {
      instancedMeshRef.current.setColorAt(cz, new THREE.Color('#770077'))
    })

    // Update the instance
    instancedMeshRef.current.instanceMatrix.needsUpdate = true
    instancedMeshRef.current.instanceColor.needsUpdate = true
    instancedMeshRef.current.material.opacity = 0.3;
    instancedMeshRef.current.material.transparent = true;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, camZone])

  const gridToIndex = (grid) => {
    return grid[0] * gridZ + grid[1]
  }

  const handleMouseDraw = (e) => {
    const pointX = e.point.x
    const pointZ = e.point.z
    
    // convert point to grid index then update grid
    const gridX = Math.round( (pointX / gridScale) - gridScale )
    const gridZ = Math.round( (pointZ / gridScale) + gridScale ) * -1
    setNodeInfo([gridX,gridZ])
    
    if (!drawMode) return

    const tempGrid = {...grid}
    const node = tempGrid.nodes[gridZ][gridX]
    if (brush == "walk") {
      if (mouseButton == 0 && node.walkable == false) {
        node.walkable = true
        setGrid(tempGrid)
      } else if (mouseButton == 2 && node.walkable == true) {
        node.walkable = false
        setGrid(tempGrid)
      }
    } else if (brush == "zone") {
      const index = gridToIndex([gridX, gridZ])
      const tempCamZone = [...camZone]

      if (mouseButton == 0) {
        if (tempCamZone.includes(index)) return
        tempCamZone.push(index)
        setCamZone(tempCamZone)
      } else if (mouseButton == 2) {
        if (tempCamZone.includes(index)) {
          const cleanArray = tempCamZone.filter(item => item !== index)
          setCamZone(cleanArray) 
        }
      }
    }
  }

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setMouseButton(0)
    }
    else if (e.button === 2) {
      setMouseButton(2)
    }
    setDrawMode(true);
  };

  const handleMouseUp = () => {
    setDrawMode(false);
  };

  useEffect(() => {
    const preventContextMenu = (e) => {
      e.preventDefault()
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('contextmenu', preventContextMenu)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('contextmenu', preventContextMenu)
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