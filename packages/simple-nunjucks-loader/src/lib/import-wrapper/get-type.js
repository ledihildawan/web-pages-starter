const tagRegex = /\[([^ ]+) +([^[]+)]/;

export function getType(instance) {
  const type = Object.prototype.toString.call(instance);
  const [, , tagType] = tagRegex.exec(type);
  return tagType;
}
