function Printer(){

    return(
        <>
        <label>เครื่องพิมพ์</label>
         <div className=" p-2 grid grid-cols-2 md:grid-cols-3 gap-4 items-center text-base sm:text-sm text-slate-800">
            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="printer"
                value="MOZ 4 สี"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">MOZ 4 สี</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="printer"
                value="GTO 52"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800">GTO 52</span>
            </label>

             <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="printer"
                value="MOZ 2 สี"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">MOZ 2 สี</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="printer"
                value="Gestetner 411"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">Gestetner 411</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="printer"
                value="KORD 64"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800">KORD 64</span>
            </label>

             <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="printer"
                value="Riso"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">Riso</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="printer"
                value="ตีธง"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">ตีธง</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="printer"
                value="FUJI B9110"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800">FUJI B9110</span>
            </label>    
            
          </div>
        
        </>
    )
}
export default Printer