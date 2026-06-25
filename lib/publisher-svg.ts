export function createWordmarkSvg(
  name: string,
  options?: { mono?: boolean; accent?: string }
): string {
  const mono = options?.mono ?? false;
  const fill = mono ? "#1a1a1a" : (options?.accent ?? "#1a1a1a");
  const fontSize = name.length > 12 ? 11 : 13;
  const width = Math.max(72, name.length * 7 + 16);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 32" role="img" aria-label="${name}"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="600" letter-spacing="0.04em" fill="${fill}">${name}</text></svg>`;
}
