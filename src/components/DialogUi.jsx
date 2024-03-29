/* eslint-disable react/prop-types */

const DialogUi = ({ dialog, setDialog }) => {
  const handleClick = () => {
    const tempDialog = [...dialog]
    tempDialog.splice(0, 1)
    setDialog(tempDialog)
  }
  const style = {
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: "600px",
    fontSize: "xx-large"
  }

  return (
    <div className="background" onClick={handleClick}  style={style}>
      {dialog.length > 0 && 
        <p>{dialog[0]}</p>
      }
    </div>
  )
}

export default DialogUi