/**
 * The part of a photo of aspect `photo` that a box of aspect `box` shows with object-fit: cover and
 * object-position at `focus` (0..1 from the top left): offset and size in the photo's uv, v up.
 */
export function coverCrop(box: number, photo: number, [fx, fy]: readonly [number, number]) {
  const w = Math.min(1, box / photo);
  const h = Math.min(1, photo / box);
  return [fx * (1 - w), (1 - fy) * (1 - h), w, h];
}
