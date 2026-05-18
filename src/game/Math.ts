export const Math2 = {
    lerp: (a: number, b: number, t: number) => a + (b - a) * t,
    rand: (min: number, max: number) => Math.random() * (max - min) + min,
    dist: (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)
};
