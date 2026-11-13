// Shader from the supplied Velaris component; lifecycle adapted for this site.
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils.js';

const DEFAULT_COLORS = ['#291008', '#d65d25', '#8e301b', '#f8b36a'];
function hexToRgb(hex) {
  const text = hex.replace('#', '');
  const expanded = text.length === 3 ? [...text].map(x => x + x).join('') : text;
  return [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16) / 255);
}

export default function Velaris({ bg = '#1b100a', colors = DEFAULT_COLORS, speed = 1.1, grain = 0.35, className, children }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [generation, setGeneration] = useState(0);
  const colorsKey = JSON.stringify(colors);
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;
    function shader(type, source) {
      const result = gl.createShader(type);
      gl.shaderSource(result, source); gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) { gl.deleteShader(result); return null; }
      return result;
    }
    const vertex = shader(gl.VERTEX_SHADER, vertexShaderGLSL);
    const fragment = shader(gl.FRAGMENT_SHADER, fragmentShaderGLSL);
    if (!vertex || !fragment) { if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment); return; }
    const program = gl.createProgram();
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return; }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(['u_resolution', 'u_time', 'u_grain', 'u_colors[0]', 'u_bg'].map(name => [name, gl.getUniformLocation(program, name)]));
    const palette = JSON.parse(colorsKey).slice(0, 4);
    while (palette.length < 4) palette.push(palette.at(-1) || '#000000');
    gl.uniform3fv(uniforms['u_colors[0]'], new Float32Array(palette.flatMap(hexToRgb)));
    gl.uniform3fv(uniforms.u_bg, hexToRgb(bg)); gl.uniform1f(uniforms.u_grain, grain);
    let frame = 0, lastTime = 0, elapsed = 0, inView = false, lost = false;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    const canAnimate = () => inView && !document.hidden && !motion.matches && !connection?.saveData && !lost;
    function draw() {
      if (lost) return;
      gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.u_time, elapsed * 0.001 * speed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); canvas.dataset.ready = 'true';
    }
    function render(time) {
      if (!canAnimate()) { frame = 0; return; }
      if (time - lastTime >= 1000 / 30) { elapsed += lastTime ? Math.min(time - lastTime, 60) : 0; lastTime = time; draw(); }
      frame = requestAnimationFrame(render);
    }
    function sync() {
      cancelAnimationFrame(frame); frame = 0; lastTime = 0;
      if (canAnimate()) frame = requestAnimationFrame(render); else draw();
    }
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 1.25);
      canvas.width = Math.max(1, Math.round(container.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(container.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height); draw();
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container); resize();
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }); observer.observe(container);
    const contextLost = event => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); delete canvas.dataset.ready; };
    const restored = () => setGeneration(value => value + 1);
    canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', restored);
    document.addEventListener('visibilitychange', sync); motion.addEventListener('change', sync); connection?.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', restored);
      document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync); connection?.removeEventListener('change', sync);
      gl.deleteBuffer(buffer); gl.deleteProgram(program);
    };
  }, [bg, colorsKey, grain, speed, generation]);
  return <div ref={containerRef} className={cn('velaris', className)}><canvas ref={canvasRef} aria-hidden="true" /><div className="velaris-content">{children}</div></div>;
}

const vertexShaderGLSL = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderGLSL = `
precision highp float;
varying vec2 vUv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3 u_colors[4];
uniform vec3 u_bg;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
          -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 p = uv - 0.5;
  p.x *= ratio;
  float t = u_time * 0.1;

  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);

  vec3 col = u_bg;
  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);
  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);
  float glow = (1.0 - smoothstep(0.0, 0.8, dist)) * 0.3;
  col += u_colors[1] * glow;
  col = mix(col * 0.2, col, vignette);
  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;
  gl_FragColor = vec4(col, 1.0);
}
`;


