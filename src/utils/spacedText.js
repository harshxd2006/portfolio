export function toSpacedLabel(text) {
  return text
    .split(/(\s+)/)
    .map((part) => (/\s+/.test(part) ? part.replace(/ /g, '  ') : part.split('').join(' ')))
    .join('');
}
