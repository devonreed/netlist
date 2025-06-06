
import { useState, useEffect } from "react";
import Schematic from './Schematic.tsx';
import type { Netlist } from "./Netlist.tsx";
import FileUploadButton from './FileUploadButton.tsx';

export default function HipsterMeter() {
  const [netlist, setNetlist] = useState<Netlist | null>(null);

  useEffect(() => {
    console.log("Draw/Redraw");
  }, [netlist]);

  const handleUploadComplete = (jsonString: string) => {
    console.log(jsonString)
    try {
      const jsonObj = JSON.parse(jsonString);
      setNetlist(jsonObj as Netlist);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <FileUploadButton onUploadComplete={handleUploadComplete} />
      {netlist && <Schematic
        netlist={netlist}
      />}
    </div>
  );
}
