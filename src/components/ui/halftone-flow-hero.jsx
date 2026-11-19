// Background-only adaptation of Kedhareswer's supplied Halftone Flow Hero.
// Hero and footer own their text, buttons, and layout.
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils.js';

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform float uIntro;
uniform float uCell;
uniform vec3 uGround;
uniform vec3 uFlow;
uniform vec3 uHot;
uniform float uGlow;
uniform float uBloom;
uniform float uHaze;

float flow(vec2 p,float t) {
  vec2 w=p*2.;
  for(int i=1;i<6;i++) {
    float fi=float(i);
    w+=vec2(.85/fi*sin(fi*w.y*1.2+t*.42+fi*2.3),.7/fi*cos(fi*w.x*1.05-t*.31+fi*1.1));
  }
  float b=.5+.5*sin(w.x*2.6-w.y*1.7);
  return smoothstep(.15,1.,pow(b,2.2));
}

void main() {
  float a=.5236;
  mat2 R=mat2(cos(a),-sin(a),sin(a),cos(a));
  vec2 px=R*gl_FragCoord.xy;
  vec2 cell=floor(px/uCell);
  vec2 cc=(cell+.5)*uCell;
  vec2 cs=(cc*R-.5*uRes)/uRes.y;
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float I=flow(cs,uTime);
  float md=length(cs-uMouse);
  I=clamp(I+uHover*.55*exp(-md*md*14.),0.,1.);
  I*=uIntro;
  float r=sqrt(I)*.54*uCell;
  float d=length(px-cc);
  float dotm=1.-smoothstep(r-1.,r+.6,d);
  float g=flow(p,uTime)*uIntro;
  // Blend the glow so the same orange ink also works on the light ground.
  vec3 col=mix(uGround,uFlow,g*(.1+uHaze*.3));
  vec3 ink=mix(uFlow,uHot,smoothstep(.7,1.,I)*.85);
  // A feathered halo surrounds each bright dot while its printed core stays sharp.
  float halo=exp(-pow(d/(max(r,.5)+uCell*.5),2.))*smoothstep(.25,1.,I);
  col=mix(col,ink,halo*uGlow*.35);
  col=mix(col,ink,dotm);
  // Analytic bloom avoids another full-screen render pass or blurred canvas.
  float bloom=pow(I,3.)*exp(-pow(d/(uCell*.8),2.));
  col+=mix(uFlow,uHot,.8)*bloom*uBloom*.22;
  vec2 uv=gl_FragCoord.xy/uRes;
  float vignette=1.-smoothstep(.3,1.1,length((uv-.5)*vec2(1.,1.25)));
  col=mix(uGround,col,mix(.6,1.,vignette));
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
`;

function rgb(hex) {
  return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
}

export default function HalftoneFlowBackground({ className, dotSize = 5, glow = 0.6, bloom = 0.4, haze = 0.4 }) {
  const hostRef = useRef(null);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    const section = host.closest('.hero, .site-footer') || host.parentElement;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) { canvas.remove(); return; }
    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (program) gl.deleteProgram(program);
      canvas.remove();
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      canvas.remove();
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const U = Object.fromEntries(['uRes', 'uTime', 'uMouse', 'uHover', 'uIntro', 'uCell', 'uGround', 'uFlow', 'uHot', 'uGlow', 'uBloom', 'uHaze'].map(name => [name, gl.getUniformLocation(program, name)]));
    gl.uniform1f(U.uGlow, Math.max(0, Math.min(1, glow)));
    gl.uniform1f(U.uBloom, Math.max(0, Math.min(1, bloom)));
    gl.uniform1f(U.uHaze, Math.max(0, Math.min(1, haze)));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, hover: 0, targetHover: 0 };
    let frame = 0, last = 0, time = 0, intro = 0, inView = false, lost = false, dpr = 1;

    function palette() {
      const dark = document.documentElement.dataset.theme === 'dark';
      gl.uniform3fv(U.uGround, rgb(dark ? '#090909' : '#f6f4ee'));
      gl.uniform3fv(U.uFlow, rgb('#d9521d'));
      gl.uniform3fv(U.uHot, rgb(dark ? '#ffb27c' : '#ef8b42'));
    }
    function draw(delta = 0) {
      if (lost) return;
      if (reduce.matches) intro = 1;
      else {
        time += delta;
        intro = Math.min(1, intro + delta / 1.8);
      }
      pointer.x += (pointer.tx - pointer.x) * .08;
      pointer.y += (pointer.ty - pointer.y) * .08;
      pointer.hover += (pointer.targetHover - pointer.hover) * .06;
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, time + 4);
      gl.uniform2f(U.uMouse, pointer.x, pointer.y);
      gl.uniform1f(U.uHover, reduce.matches ? 0 : pointer.hover);
      gl.uniform1f(U.uIntro, 1 - Math.pow(1 - intro, 3));
      gl.uniform1f(U.uCell, Math.max(3, dotSize) * dpr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.ready = 'true';
    }
    const canAnimate = () => inView && !document.hidden && !reduce.matches && !lost;
    function loop(now) {
      frame = 0;
      if (!canAnimate()) return;
      if (!last) last = now;
      const elapsed = now - last;
      if (elapsed >= 1000 / 30) { last = now; draw(Math.min(elapsed / 1000, .1)); }
      frame = requestAnimationFrame(loop);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      draw();
      if (canAnimate()) frame = requestAnimationFrame(loop);
    }
    function resize() {
      const bounds = host.getBoundingClientRect();
      dpr = Math.min(1.5, devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    }
    function move(event) {
      if (!fine.matches || event.pointerType === 'touch' || reduce.matches) return;
      const bounds = host.getBoundingClientRect();
      pointer.tx = (event.clientX - bounds.left - bounds.width / 2) / bounds.height;
      pointer.ty = (bounds.height / 2 - (event.clientY - bounds.top)) / bounds.height;
      pointer.targetHover = 1;
    }
    const leave = () => { pointer.targetHover = 0; };
    const themeObserver = new MutationObserver(() => { palette(); sync(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(section);
    const onLost = event => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); delete canvas.dataset.ready; };
    const onRestored = () => setGeneration(value => value + 1);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    section.addEventListener('pointermove', move, { passive: true });
    section.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener('change', sync);
    palette();
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect(); resizeObserver.disconnect(); themeObserver.disconnect();
      section.removeEventListener('pointermove', move); section.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', sync); reduce.removeEventListener('change', sync);
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      gl.deleteBuffer(buffer); gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, [dotSize, glow, bloom, haze, generation]);

  return <div ref={hostRef} className={cn('halftone-flow-background', className)} aria-hidden="true" />;
}
