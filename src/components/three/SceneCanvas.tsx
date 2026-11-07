"use client";

import { Canvas } from "@react-three/fiber";

export default function SceneCanvas() {
  return (
    <div className="aspect-video w-full">
      <Canvas dpr={[1, 1.75]} frameloop="demand" gl={{ antialias: true }}>
        <ambientLight intensity={0.6} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial />
        </mesh>
      </Canvas>
    </div>
  );
}
