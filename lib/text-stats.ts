export type TextStats = {
  characters: number;
  lines: number;
  bytes: number;
};


export function getTextStats(
  text: string
): TextStats {

  return {
    characters: text.length,

    lines:
      text.length === 0
        ? 0
        : text.split("\n").length,

    bytes:
      new TextEncoder()
        .encode(text)
        .length,
  };

}