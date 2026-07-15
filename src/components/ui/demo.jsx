'use client'

import { SplineScene } from "@/components/ui/splite";

export function SplineSceneBasic() {
  return (
    <div className="spline-tunnel-blend">
      <div className="spline-canvas-host">
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="spline-canvas-blend"
        />
      </div>

      <div className="spline-intro-text">
        <h1 className="spline-intro-name">
          HARSH
        </h1>
        <p className="spline-intro-subtitle">
          Third-Year Undergrad · Engineering Physics · NIT Hamirpur.
        </p>
      </div>
    </div>
  );
}
