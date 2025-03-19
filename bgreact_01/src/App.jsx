import { useState } from "react";

function App() {

  const [color, setColor]=useState("olive")

  return (
    <>

    <div className="w-full h-screen duration-200" style={{backgroundColor:color}}>
      <div className="fixed flex flex-wrap justify-center bottom-12 inset-x-0 px-2">
        <div className="flex flex-wrap justify-center gap-3 shadow-xl bg-white px-3 py-2 rounded-xl">

          <button 
          onClick={()=>setColor("red")}
          className="outline-none px-4 py-1 rounded-full text-white"
          style={{background:"red"}}
          >Red</button>

          <button 
          onClick={()=>setColor("maroon")}
          className="outline-none px-4 py-1 rounded-full text-white"
          style={{background:"maroon"}}
          >Maroon</button>

          <button 
          onClick={()=>setColor("yellow")}
          className="outline-none px-4 py-1 rounded-full text-white"
          style={{background:"yellow"}}
          >Yellow</button>

          <button 
          onClick={()=>setColor("orange")}
          className="outline-none px-4 py-1 rounded-full text-white"
          style={{background:"orange"}}
          >Orange</button>

          <button 
          onClick={()=>setColor("grey")}
          className="outline-none px-4 py-1 rounded-full text-white"
          style={{background:"grey"}}
          >Grey</button>

          <button 
          onClick={()=>setColor("black")}
          className="outline-none px-4 py-1 rounded-full text-white"
          style={{background:"black"}}
          >Black</button>

          <button 
          onClick={()=>setColor("blue")}
          className="outline-none px-4 py-1 rounded-full text-white"
          style={{background:"blue"}}
          >blue</button>

        </div>
      </div>
    </div>

    

    </>
  )
}

export default App