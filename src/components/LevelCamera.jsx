/* eslint-disable react/prop-types */
import { Box, OrbitControls } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useEffect } from "react"

const LevelCamera = ({ camObject }) => {
  const { camera } = useThree()

  useEffect(()=>{
    if (!camObject) return
    if (!camera) return

    camera.copy(camObject)
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camObject])

  return (
    <>
      {/* <OrbitControls /> */}
      <Box position={[4,0,-2]} />
    </>
  )
}

export default LevelCamera