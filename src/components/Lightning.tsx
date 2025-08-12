import React, { useEffect, useRef } from "react";

export interface LightningProps {
  hue?: number; // 0-360
  xOffset?: number; // horizontal offset in NDC units
  speed?: number; // animation speed multiplier
  intensity?: number; // brightness multiplier
  size?: number; // scale factor for fbm
  className?: string; // optional styling hook
  height?: string | number; // CSS height (e.g., '90vh')
}

/**
 * Lightning (WebGL shader)
 * Drop-in background canvas that renders a vertical, animated lightning beam.
 */
const Lightning: React.FC<LightningProps> = ({
  hue = 230,
  xOffset = 0,
  speed = 1,
  intensity = 1,
  size = 1,
  className,
  height = "90vh",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      // Match drawing buffer to CSS size for crisp rendering
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const { clientWidth, clientHeight } = canvas;
      const width = Math.max(1, Math.floor(clientWidth * dpr));
      const height = Math.max(1, Math.floor(clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const gl = canvas.getContext("webgl");
    if (!gl) {
      // eslint-disable-next-line no-console
      console.error("WebGL not supported");
      return () => window.removeEventListener("resize", resizeCanvas);
    }
    let contextLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      // simplest approach: reload to re-init GL state
      window.location.reload();
    };
    canvas.addEventListener("webglcontextlost", onContextLost as EventListener, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

  const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;
      
      #define OCTAVE_COUNT 10

      // Convert HSV to RGB.
      vec3 hsv2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash11(float p) {
          p = fract(p * .1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
      }

      float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
      }

      mat2 rotate2d(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat2(c, -s, s, c);
      }

      float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = hash12(ip);
          float b = hash12(ip + vec2(1.0, 0.0));
          float c = hash12(ip + vec2(0.0, 1.0));
          float d = hash12(ip + vec2(1.0, 1.0));
          
          vec2 t = smoothstep(0.0, 1.0, fp);
          return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }

      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < OCTAVE_COUNT; ++i) {
              value += amplitude * noise(p);
              p *= rotate2d(0.45);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }

      void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
          // Normalized pixel coordinates.
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          uv.x *= iResolution.x / iResolution.y;
          // Apply horizontal offset.
          uv.x += uXOffset;
          
          // Subtle warp for motion; keep the bolt near the center
          float warp = fbm(uv * uSize + 0.8 * iTime * uSpeed);
          uv.x += (warp - 0.5) * 0.35;
          
          float dist = abs(uv.x);
          // Compute base color with animated hue based on time.
          // uHue acts as a base offset; hue cycles fully over time.
          float h = fract(uHue / 360.0 + 0.05 * iTime);
          vec3 baseColor = hsv2rgb(vec3(h, 0.75, 1.0));

          // Bright core + soft halo for visibility
          float core = 0.020 / (dist * dist + 0.0008);
          float halo = 0.009 / (dist + 0.020);
          float flicker = mix(0.85, 1.15, hash11(iTime * uSpeed * 3.0));
          vec3 col = baseColor * (core + halo) * flicker * uIntensity;
          col = clamp(col, 0.0, 1.0);
          fragColor = vec4(col, 1.0);
      }

      void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // eslint-disable-next-line no-console
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      window.removeEventListener("resize", resizeCanvas);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      window.removeEventListener("resize", resizeCanvas);
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // eslint-disable-next-line no-console
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      window.removeEventListener("resize", resizeCanvas);
      return;
    }
    gl.useProgram(program);

    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("webglcontextlost", onContextLost as EventListener);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    if (aPosition >= 0) {
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    }

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const uHueLocation = gl.getUniformLocation(program, "uHue");
    const uXOffsetLocation = gl.getUniformLocation(program, "uXOffset");
    const uSpeedLocation = gl.getUniformLocation(program, "uSpeed");
    const uIntensityLocation = gl.getUniformLocation(program, "uIntensity");
    const uSizeLocation = gl.getUniformLocation(program, "uSize");

    let rafId = 0;
    const startTime = performance.now();
    const render = () => {
      try {
        if (contextLost) return; // stop drawing until restored
        resizeCanvas();
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (iResolutionLocation) gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
        const currentTime = performance.now();
        if (iTimeLocation) gl.uniform1f(iTimeLocation, (currentTime - startTime) / 1000.0);
        if (uHueLocation) gl.uniform1f(uHueLocation, hue);
        if (uXOffsetLocation) gl.uniform1f(uXOffsetLocation, xOffset);
        if (uSpeedLocation) gl.uniform1f(uSpeedLocation, speed);
        if (uIntensityLocation) gl.uniform1f(uIntensityLocation, intensity);
        if (uSizeLocation) gl.uniform1f(uSizeLocation, size);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Lightning render error:", err);
        return; // stop loop on error
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
  window.removeEventListener("resize", resizeCanvas);
  canvas.removeEventListener("webglcontextlost", onContextLost as EventListener);
  canvas.removeEventListener("webglcontextrestored", onContextRestored);
      // Cleanup GL resources
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
  if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      gl.useProgram(null);
  if (aPosition >= 0) gl.disableVertexAttribArray(aPosition);
  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
    };
  }, [hue, xOffset, speed, intensity, size]);

  return (
    <canvas
      ref={canvasRef}
      className={["w-full h-full relative", className].filter(Boolean).join(" ")}
  style={{ width: "100%", height, display: "block" }}
    />
  );
};

export default Lightning;
