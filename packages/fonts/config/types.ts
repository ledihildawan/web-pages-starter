export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type FontConfig = {
  name: string;
  family: string;
  weights?: readonly FontWeight[];
};

export type FontStack = {
  sans: FontConfig;
  serif?: FontConfig;
  mono?: FontConfig;
  [key: string]: FontConfig | undefined;
};
