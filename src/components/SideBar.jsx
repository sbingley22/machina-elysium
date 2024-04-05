/* eslint-disable react/prop-types */

import MorgueKeypad from "./puzzles/MorgueKeypad"


const SideBar = ({ playerStatus, xMode, shotCharge, photoImg, inventory, setInventory, setPlayerFlag, puzzle, setPuzzle, setDialog }) => {
  let costume = "Swimsuit"

  if (xMode) {
    costume = "Swimsuit"
  }

  const itemClicked = (index) => {
    const item = inventory[index]
    let removeItem = false
    //console.log(item)

    if (item.type == "healing") {
      removeItem = true
      setPlayerFlag({
        action: "healing",
        value: 35
      })
    }

    if (removeItem) {
      const tempInventory = [...inventory]
      tempInventory.splice(index, 1)
      setInventory(tempInventory)
    }
  }

  let borderCol = "black"
  if (shotCharge == 1) borderCol = "#555"
  else if (shotCharge == 2) borderCol = "#AAA"
  else if (shotCharge >= 3) borderCol = "white"

  const statusImage = `./status/${playerStatus}-${costume}.gif`
  const photoImage = `./photos/${photoImg}.png`

  const statusStyle = {
    width: '100%',
    height: 'auto',
    padding: 0,
    margin: 0,
    display: "block",
    border: "2px solid " + borderCol
  }

  const photosStyle = {
    width: '100%',
    height: 'auto',
    padding: 0,
    margin: 0,
    display: "block"
  }

  const itemStyle = {
    userSelect: "none",
    cursor: "pointer",
    borderBottom: "1px solid black",
    textAlign: "center"
  }

  return (
    <div className="sidebar">
      <div className="top">
        <div className="status">
          <img src={statusImage} style={statusStyle} />
        </div>
        <div className="ui">
          { inventory.map((item, index) => (
            <div
              key={index}
              onClick={()=>itemClicked(index)}
              style={itemStyle}
            >
              { item.label }
            </div>
          ))}
        </div>
      </div>
      <div>
        { puzzle == null && <div className="photos">
          <img src={photoImage} style={photosStyle} />
        </div> }
        { puzzle == "morgueKeypad" && <MorgueKeypad setPuzzle={setPuzzle} inventory={inventory} setInventory={setInventory} setDialog={setDialog} />}
      </div>
    </div>
  )
}

export default SideBar