/* eslint-disable react/prop-types */

const MainMenu = ({ setMode }) => {

  const style = {
    backgroundImage: 'url(./title.gif)',
    height: "100%",
    padding: "30px",
    display: "grid",
    gridTemplateColumns: "5fr 1fr"
  }

  const buttonStyle = {
    fontSize: "larger",
    display: "inline-block"
  }

  const headerStyle = {
    color: "#EEAAEE",
    WebkitTextStroke: "2px #000000", // WebKit prefix for text stroke
    textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
  }  

  const optionsStyle = {
    display: "grid",
    gridTemplateRows: "4fr 1fr 1fr 1fr"
  }

  return (
    <div style={style}>
      <div></div>
      <div style={optionsStyle}>
        <h1 style={headerStyle}>Machina Elysium</h1>
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
    </div>
  )
}

export default MainMenu