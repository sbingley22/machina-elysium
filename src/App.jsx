import { useEffect, useRef, useState } from 'react'
import './App.css'
import MainMenu from './components/MainMenu'
import Game from './components/Game'
import LevelEditor from './components/LevelEditor'

function App() {
  const [mode, setMode] = useState(1)
  // eslint-disable-next-line no-unused-vars
  const [xMode, setXMode] = useState(0)

  const style = {
    backgroundImage: mode == 0 ? `url(./titleShot.png)` : '',
    height: "100%"
  }

  const menuMusic = useRef()

  const clicked = () => {
    if (mode == 0) { 
      setMode(1)

      menuMusic.current.play()
    }
    else if (mode == 1) {
      menuMusic.current.pause()
    }
  }

  useEffect(() => {
    if (menuMusic.current) {
      menuMusic.current.volume = 0.025
    }
    //setXMode(1)
  }, [])

  return (
    <>
      <div style={style} onClick={clicked}>
        { mode == 1 && <MainMenu setMode={setMode} /> }
        { mode == 2 && <Game xMode={xMode} /> }
        { mode == 9 && <LevelEditor /> }

        <audio
          ref={menuMusic}
          id="menuMusic"
          src='./audio/menu-music.wav'
          loop
          autoPlay
        />
      </div>
    </>
  )
}

export default App
