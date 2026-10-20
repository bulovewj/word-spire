export const fmt = (n: number) => n.toFixed(3)

/** 붙여 넣은 글을 줄마다 답 하나로 */
export const splitLines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)
