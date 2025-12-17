export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];
