/** Pointer position, -1 to 1 from the screen centre, smoothed. Read by the camera, the key light and the text parallax. */
export const pointer = { x: 0, y: 0 };

const target = { x: 0, y: 0 };

/** Starts listening. Returns the cleanup. */
export function trackPointer() {
  const move = (e: PointerEvent) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", move, { passive: true });
  return () => window.removeEventListener("pointermove", move);
}

/** Eases the pointer toward where it really is; call once per frame with the frame time in seconds. */
export function stepPointer(dt: number) {
  const k = 1 - Math.exp(-dt * 4);
  pointer.x += (target.x - pointer.x) * k;
  pointer.y += (target.y - pointer.y) * k;
}
