interface Config {
  name: string;
  version: number;
}

const config: Config = {
  name: 'inline-ts',
  version: 1.0,
};

export function greet(): string {
  return `Hello from ${config.name} v${config.version}!`;
}

console.log(greet());
