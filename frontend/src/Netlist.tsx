export interface Netlist {
  components: Component[];
  nets: Net[];
}

export interface Component {
  id: string;
  type: string;
  value: string;
  pins: Record<string, string>; // pinName -> netId
}

export interface Net {
  id: string;
  nodes: string[]; // e.g. ["V1.negative", "C1.2"]
}