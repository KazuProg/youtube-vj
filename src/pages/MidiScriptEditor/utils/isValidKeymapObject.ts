import type { KeymapObject } from "../types";

export function isValidKeymapObject(obj: unknown): obj is KeymapObject {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const o = obj as Record<string, unknown>;
  if (typeof o.device !== "object" || o.device === null) {
    return false;
  }
  const device = o.device as Record<string, unknown>;
  if (typeof device.name !== "string" || typeof device.manufacturer !== "string") {
    return false;
  }
  if (typeof o.service !== "string") {
    return false;
  }
  if (!Array.isArray(o.mappings)) {
    return false;
  }

  return true;
}
