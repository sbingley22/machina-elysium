/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */

const GridGame = ({ grid, gridScale = 0.5, setGridClick, setCurrentCursor }) => {
  const gridX = grid && grid.width ? grid.width : 1
  const gridZ = grid && grid.height ? grid.height : 1

  const handleClick = (e) => {
    const pointX = e.point.x
    const pointZ = e.point.z * -1
    
    // convert point to grid index then update grid
    const gridX = Math.floor( (pointX / gridScale) )
    const gridZ = Math.floor( (pointZ / gridScale) )
    setGridClick([gridX,gridZ])
    //console.log("Grid Clicked: ", [gridX,gridZ])
  }

  const handleMove = (e) => {
    const pointX = e.point.x
    const pointZ = e.point.z * -1
    
    // convert point to grid index then update grid
    const gridX = Math.floor( (pointX / gridScale) )
    const gridZ = Math.floor( (pointZ / gridScale) )
    
    // Set cursor to walkable
    if (grid.nodes[gridZ][gridX].walkable) setCurrentCursor("move")
    else setCurrentCursor("crosshair")
  
  }

  if (!grid) return

  return (
    <group 
      //position={[gridScale/2, 0, -gridScale/2]}
      position={[(gridX*gridScale)/2, 0, (gridZ*gridScale)/-2]}
      scale={[gridX*gridScale, 1, gridZ*gridScale]}
    >
      <mesh 
        receiveShadow
        rotation-x={-Math.PI/2}
        onClick={handleClick}
        onPointerMove={handleMove}
        onPointerLeave={()=>setCurrentCursor("crosshair")}
      >
        <planeGeometry />
        <shadowMaterial attach="material" opacity={0.8} transparent />
        {/* <meshPhongMaterial color={"white"} /> */}
      </mesh>
    </group>
  )
}

export default GridGame