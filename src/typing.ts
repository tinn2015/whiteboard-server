export interface ModifiedObjects {
  at: string;
  mos: ModifiedObject[];
}

export interface ModifiedObject {
  oid: string;
  ops: Record<string, number>;
}
