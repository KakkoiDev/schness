export const DRAG_THRESHOLD = 8;

export function movedEnough(start, current) {
  return Math.hypot(current.clientX - start.startX, current.clientY - start.startY) >= DRAG_THRESHOLD;
}
