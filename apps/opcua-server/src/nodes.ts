import { DataType, Variant } from "node-opcua";
import type { Namespace, UAObject } from "node-opcua";
import { TAGS, type Tag, type MachineState } from "./simulation";

const UNITS: Record<Tag, string> = {
  güç: "kW",
  tüketim: "litre/h",
  sıcaklık: "°C",
  vibrasyon: "mm/s",
  üretim: "adet",
};

/**
 * Her makine için bir klasör ve 5 değişken node oluşturur.
 * state nesnesi mutable olduğu için get() her çağrıda güncel değeri okur.
 */
export function buildMachineNodes(
  namespace: Namespace,
  machinesFolder: UAObject,
  state: MachineState
): void {
  const folder = namespace.addFolder(machinesFolder, {
    browseName: state.code,
    displayName: state.code,
  });

  for (const tag of TAGS) {
    const isCounter = tag === "üretim";
    const dataType = isCounter ? DataType.Int32 : DataType.Double;

    namespace.addVariable({
      componentOf: folder,
      browseName: tag,
      displayName: `${tag} [${UNITS[tag]}]`,
      nodeId: `s=Machine_${state.code}_${tag}`,
      dataType,
      value: {
        get: () =>
          new Variant({
            dataType,
            value: isCounter ? Math.floor(state[tag]) : state[tag],
          }),
      },
    });
  }
}
