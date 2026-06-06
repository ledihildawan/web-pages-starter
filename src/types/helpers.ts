export type Booleanish = boolean | 'true' | 'false';

export type Numberish = number | string;

export type Nullable<T = void> = T | null | undefined;

export type VoidListener = VoidFunction | null | undefined;

export type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = S extends `${infer Before}${From}${infer After}`
  ? `${Before}${To}${ReplaceAll<After, From, To>}`
  : S;
