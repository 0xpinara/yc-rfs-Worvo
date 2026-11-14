/** Minimal Web Bluetooth typings for the A3 band chooser. */
interface Bluetooth {
  requestDevice(options: {
    filters?: Array<{ name?: string; services?: string[] }>;
    optionalServices?: string[];
  }): Promise<BluetoothDevice>;
}

interface BluetoothDevice extends EventTarget {
  readonly name?: string;
  readonly gatt?: { connected?: boolean };
}

interface Navigator {
  readonly bluetooth?: Bluetooth;
}
