/* eslint-disable react/prop-types */

import { useState } from "react"

const MorgueKeypad = ({ setPuzzle, inventory, setInventory, setDialog }) => {
  const style = {
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundImage: `url(./puzzles/morgueKeypad.png)`,
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
    display: "block",
    textAlign: "left"
  }
  
  const [keyValue, setKeyValue] = useState("")

  const addKey = (key) => {
    const newKey = keyValue + key
    if (newKey.length >= 4) {
      // check for pass code correct
      if (newKey == "0101") {
        addToInventory()
        setDialog(["The pod opens and I grab the keycard"])
        setPuzzle(null)
        return
      } else {
        setKeyValue("")
        return
      }
    }
    setKeyValue(newKey)
  }

  const addToInventory = () => {
    const tempInventory = [...inventory]
    tempInventory.push({
      name: "g",
      label: "g" + " key",
      type: "key",
    })
      setInventory(tempInventory)
  }

  return (
    <div style={style}>
      <button onClick={()=>setPuzzle(null)}>Exit</button>
      <button onClick={()=>addKey("0")}>0</button>
      <button onClick={()=>addKey("1")}>1</button>
      <p>{keyValue}</p>
    </div>
  )
}

export default MorgueKeypad