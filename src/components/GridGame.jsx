/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */

const GridGame = ({ grid, gridScale = 0.5, setGridClick }) => {
  const gridX = grid && grid.width ? grid.width : 1
  const gridZ = grid && grid.height ? grid.height : 1

  const handleClick = (e) => {
    const pointX = e.point.x
    const pointZ = e.point.z
    
    // convert point to grid index then update grid
    const gridX = Math.round( (pointX / gridScale) + grid.width/2 )
    const gridZ = Math.round( (pointZ / gridScale) + grid.height/2 )
    setGridClick([gridX,gridZ])
    //console.log(Math.floor(point.x), gridX)
    //console.log(gridX, gridZ)
  }

  if (!grid) return

  return (
    <group 
      position={[-gridScale/2, 0, -gridScale/2]}
      scale={[gridX*gridScale, 1, gridZ*gridScale]}
    >
      <mesh 
        receiveShadow
        rotation-x={-Math.PI/2}
        onClick={handleClick}
      >
        <planeGeometry />
        <shadowMaterial attach="material" opacity={0.8} transparent />
      </mesh>
    </group>
  )
}

export default GridGame