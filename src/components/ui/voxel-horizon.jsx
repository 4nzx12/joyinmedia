// Original Joyin Media implementation of a curved voxel sea.
// Built with WebGL and scoped CSS; contains no React Bits Pro source or dependencies.
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils.js';

function rgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map(char => char + char).join('') : value;
  return [0, 2, 4].map(offset => parseInt(full.slice(offset, offset + 2), 16) / 255);
}

export default function VoxelHorizon({
  color = '#ff8100', accentColor = '#f02600', backgroundColor = '#0A0A0A',
  density = 0.93, voxelSize = 0.9500000000000001, roundness = 0,
  tilt = 0.8200000000000001, horizon = 0.64, curvature = 1.06,
  waveHeight = 0.16, waveLength = 1.27, speed = 0, turbulence = 0,
  brightness = 0.77, glow = 3, haze = 2.24, bloom = 0.49,
  focus = 0.23, aperture = 0.39, grain = 0.28, ripples = 0.1,
  interactive = true, intro = true, paused = false, className,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    // Listen on the hero so the foreground can retain normal pointer events.
    const interactionTarget = container.closest('.hero') || container;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Voxel horizon shader could not compile:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return;
    }
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const location = name => gl.getUniformLocation(program, `u_${name}`);
    const uniforms = Object.fromEntries(['resolution', 'time', 'reveal', 'pointer', 'rippleAge'].map(name => [name, location(name)]));
    for (const [name, value] of Object.entries({ density, voxelSize, roundness, tilt, horizon, curvature, waveHeight, waveLength, turbulence, brightness, glow, haze, bloom, focus, aperture, grain, ripples })) {
      gl.uniform1f(location(name), value);
    }
    gl.uniform3fv(location('color'), rgb(color));
    gl.uniform3fv(location('accentColor'), rgb(accentColor));
    gl.uniform3fv(location('backgroundColor'), rgb(backgroundColor));

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    const still = () => motion.matches || connection?.saveData || paused;
    let frame = 0, lastTime = 0, elapsed = 0, reveal = intro && !still() ? 0 : 1;
    let inView = false, lost = false, rippleAge = 10;
    let pointer = [0.5, 0.72], lastPointerTime = 0;

    function draw() {
      if (lost) return;
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, elapsed * speed);
      gl.uniform1f(uniforms.reveal, reveal);
      gl.uniform2fv(uniforms.pointer, pointer);
      gl.uniform1f(uniforms.rippleAge, rippleAge);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      canvas.dataset.ready = 'true';
    }

    const canAnimate = () => inView && !document.hidden && !lost && !still();
    const needsFrame = () => reveal < 1 || speed !== 0 || rippleAge < 2.4;
    function render(time) {
      frame = 0;
      if (!canAnimate()) return;
      if (!lastTime || time - lastTime >= 1000 / 30) {
        const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.08) : 1 / 30;
        lastTime = time;
        elapsed += delta;
        reveal = Math.min(1, reveal + delta / 1.4);
        rippleAge += delta;
        draw();
      }
      if (needsFrame()) frame = requestAnimationFrame(render);
      else lastTime = 0;
    }

    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (still()) { reveal = 1; rippleAge = 10; }
      if (inView && !document.hidden) draw();
      if (canAnimate() && needsFrame()) frame = requestAnimationFrame(render);
    }

    function resize() {
      // Keep the shader light on high-DPI phones and very large monitors.
      const scale = Math.min(window.devicePixelRatio || 1, 1.5, 1920 / Math.max(container.clientWidth, 1));
      canvas.width = Math.max(1, Math.round(container.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(container.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    }

    function onPointer(event) {
      if (!interactive || !canAnimate() || event.pointerType === 'touch') return;
      const now = performance.now();
      if (event.type === 'pointermove' && now - lastPointerTime < 100) return;
      lastPointerTime = now;
      const bounds = container.getBoundingClientRect();
      pointer = [(event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height];
      rippleAge = 0;
      if (!frame) frame = requestAnimationFrame(render);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(container);
    const contextLost = event => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      delete canvas.dataset.ready;
    };
    const contextRestored = () => setGeneration(value => value + 1);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', contextRestored);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    connection?.addEventListener('change', sync);
    interactionTarget.addEventListener('pointermove', onPointer, { passive: true });
    interactionTarget.addEventListener('pointerdown', onPointer, { passive: true });
    resize();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
      connection?.removeEventListener('change', sync);
      interactionTarget.removeEventListener('pointermove', onPointer);
      interactionTarget.removeEventListener('pointerdown', onPointer);
      delete canvas.dataset.ready;
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [color, accentColor, backgroundColor, density, voxelSize, roundness, tilt, horizon, curvature, waveHeight, waveLength, speed, turbulence, brightness, glow, haze, bloom, focus, aperture, grain, ripples, interactive, intro, paused, generation]);

  return <div ref={containerRef} className={cn('voxel-horizon', className)} aria-hidden="true" style={{ '--voxel-background': backgroundColor, '--voxel-color': color, '--voxel-accent': accentColor }}>
    <canvas ref={canvasRef} />
  </div>;
}

const vertexSource = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentSource = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution, u_pointer;
uniform vec3 u_color, u_accentColor, u_backgroundColor;
uniform float u_time, u_reveal, u_rippleAge;
uniform float u_density, u_voxelSize, u_roundness, u_tilt;
uniform float u_horizon, u_curvature, u_waveHeight, u_waveLength, u_turbulence;
uniform float u_brightness, u_glow, u_haze, u_bloom, u_focus, u_aperture, u_grain, u_ripples;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wave(vec2 p) {
  float length = max(0.2, u_waveLength);
  return u_waveHeight * (sin(p.y * 0.64 / length - u_time * 0.65) * 0.55
    + sin(p.x * 0.48 / length + p.y * 0.32 / length - u_time * 0.4) * 0.35
    + u_turbulence * sin(p.x * 1.8 + p.y * 2.4 + u_time) * 0.2);
}

void main() {
  vec2 uv = vUv;
  float aspect = u_resolution.x / u_resolution.y;
  float x = (uv.x - 0.5) * aspect;
  float arch = u_horizon + u_curvature * pow((uv.x - 0.5) * 2.0, 2.0) * 0.105;
  arch += (1.0 - smoothstep(0.0, 1.0, u_reveal)) * 0.055;
  float below = uv.y - arch;
  float reveal = smoothstep(0.0, 0.85, u_reveal);
  vec3 col = u_backgroundColor;

  // Atmospheric light follows the arc, including a soft halo above the horizon.
  float halo = exp(-abs(below) * (24.0 / max(0.5, u_haze)));
  float centerLight = 0.65 + 0.35 * exp(-x * x * 1.8);
  col += mix(u_accentColor, u_color, 0.3) * halo * centerLight * 0.11 * u_bloom * reveal;

  // Inverse perspective maps the screen onto a tiled, gently displaced surface.
  float depth = max(below, 0.0025);
  float z = 2.4 / depth;
  vec2 world = vec2(x * z, z);
  for (int i = 0; i < 3; i++) {
    z = (2.4 + wave(world) * min(depth * 2.0, 1.0)) / depth;
    world = vec2(x * z, z);
  }
  float rippleDistance = length((uv - u_pointer) * vec2(aspect, 1.0));
  float ripple = sin(rippleDistance * 65.0 - u_rippleAge * 10.0)
    * exp(-pow((rippleDistance - u_rippleAge * 0.16) * 12.0, 2.0))
    * exp(-u_rippleAge * 2.0) * u_ripples;
  world += vec2(ripple * 0.1, ripple * 0.55);
  world.y *= mix(0.3, 1.0, u_tilt);
  vec2 grid = world * (max(0.2, u_density) / 0.15);
  vec2 cell = fract(grid) - 0.5;
  vec2 footprint = max(fwidth(grid), vec2(0.0001));

  // Rounded box distance with a depth-sensitive pixel footprint for soft focus.
  float halfSize = clamp(u_voxelSize, 0.1, 1.0) * 0.4;
  float radius = halfSize * clamp(u_roundness, 0.0, 1.0);
  vec2 box = abs(cell) - vec2(halfSize - radius);
  float distance = length(max(box, 0.0)) + min(max(box.x, box.y), 0.0) - radius;
  float blur = 0.55 + u_aperture * abs(below - u_focus) * 12.0;
  float aa = max(footprint.x, footprint.y) * blur;
  float face = 1.0 - smoothstep(-aa, aa, distance);
  float resolved = 1.0 - smoothstep(0.22, 0.9, max(footprint.x, footprint.y));
  face = mix(pow(halfSize * 2.0, 2.0), face, resolved);

  float random = hash(floor(grid));
  float crest = 0.5 + 0.5 * sin(world.y * 0.48 + world.x * 0.22 - u_time * 0.4);
  vec3 tile = mix(u_accentColor, u_color, 0.45 + crest * 0.5);
  float individualLight = mix(0.35 + random * 0.9, 0.9, 1.0 - resolved);
  float lighting = 0.5 + 0.5 * crest;
  float rim = exp(-depth * 19.0) * 0.9;
  float fog = exp(-z * 0.002 * u_haze);
  float visible = smoothstep(0.0, 0.008, below);
  float edgeLight = exp(-max(distance, 0.0) / max(0.025, aa + 0.025)) * u_glow * 0.055;
  // A shaded leading edge gives the tiles thickness without extra geometry.
  float bevel = smoothstep(-halfSize, -halfSize + 0.16, cell.y);
  vec3 field = tile * (face * mix(0.45, 1.0, bevel) + edgeLight);
  field *= individualLight * (lighting + rim) * u_brightness;
  field += tile * halo * u_bloom * 0.13;
  col += field * fog * visible * reveal * centerLight;
  col += u_color * exp(-abs(below - 0.008) * 150.0) * 0.12 * u_glow * reveal;
  float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  col += vec3((noise - 0.5) * u_grain * 0.055);
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;
