export interface FruitDef {
  key: string;
  radius: number;
  rindColor: number;
  fleshColor: number;
  points: number;
}

export const FRUIT_TYPES: readonly FruitDef[] = [
  { key: 'apple', radius: 34, rindColor: 0xd1495b, fleshColor: 0xfff1c1, points: 10 },
  { key: 'orange', radius: 36, rindColor: 0xf77f00, fleshColor: 0xffc971, points: 10 },
  { key: 'watermelon', radius: 46, rindColor: 0x2b9348, fleshColor: 0xff5964, points: 15 },
  { key: 'kiwi', radius: 28, rindColor: 0x6b4423, fleshColor: 0xb6e388, points: 12 },
  { key: 'plum', radius: 26, rindColor: 0x6a4c93, fleshColor: 0xe3c9ff, points: 12 },
  { key: 'banana', radius: 30, rindColor: 0xffd60a, fleshColor: 0xfff3b0, points: 10 }
];

export const BOMB_DEF = { key: 'bomb', radius: 32 };

export function fruitByKey(key: string): FruitDef {
  const found = FRUIT_TYPES.find((f) => f.key === key);
  if (!found) throw new Error(`Unknown fruit key: ${key}`);
  return found;
}
