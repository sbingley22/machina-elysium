/* eslint-disable react/prop-types */


const SideBar = ({ playerStatus, xMode, shotCharge, photoImg, inventory, setInventory }) => {
  let costume = "Swimsuit"

  if (xMode) {
    costume = "Swimsuit"
  }

  const itemClicked = (index) => {
    const item = inventory[index]
    let removeItem = false
    console.log(item)

    if (item.type == "healing") {
      removeItem = true
    }

    if (removeItem) {
      const tempInventory = [...inventory]
      tempInventory.splice(index, 1)
      setInventory(tempInventory)
    }
  }

  let borderCol = "black"
  if (shotCharge == 1) borderCol = "grey"
  if (shotCharge == 2) borderCol = "white"

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
      <div className="photos">
        <img src={photoImage} style={photosStyle} /> 
      </div>
    </div>
  )
}

export default SideBar