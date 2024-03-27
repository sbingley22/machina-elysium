/* eslint-disable react/prop-types */

const MainMenu = ({ setMode }) => {

  const style = {
    backgroundImage: `url(./titleShot.png)`,
    height: "100%",
    padding: "30px"
  }

  const buttonStyle = {
    fontSize: "larger"
  }

  return (
    <div style={style}>
      <h1>Machina Elysium</h1>
      <button
        style={buttonStyle} 
        onClick={()=>{setMode(2)}}
      >
        Play
      </button>
      <button
        style={buttonStyle} 
        onClick={()=>{setMode(9)}}
      >
        Level Editor
      </button>
    </div>
  )
}

export default MainMenu