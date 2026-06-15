export type DateValue = string | number | Date;

export type DateTimePreset = 'short' | 'medium' | 'long' | 'full';

export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export type JsonData = Record<string, JsonValue>;

export type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = S extends `${infer Before}${From}${infer After}` ? `${Before}${To}${ReplaceAll<After, From, To>}` : S;
