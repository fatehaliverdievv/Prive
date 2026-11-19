import { useEffect, useRef } from 'react';

type Props = { src?: string };
type Dot = { x: number; y: number; r: number; vy: number; vx: number; a: number; p: number; big: boolean };

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0., 1.); }
`;

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uMouse;
uniform float uTime;
uniform float uStr;
uniform float uAmp;

void main(){
  vec2 frag = gl_FragCoord.xy;
  /* cover fit */
  vec2 s = uRes / uImg;
  float sc = max(s.x, s.y);
  vec2 size = uImg * sc;
  vec2 uv = (frag - 0.5 * uRes) / size + 0.5;
  uv.y = 1.0 - uv.y;

  /* ambient waves (yavaş-yavaş güclənir) */
  float t = uTime;
  uv += uAmp * 0.0035 * vec2(sin(uv.y * 9.0 + t * 0.8), cos(uv.x * 7.0 + t * 0.65));
  uv += uAmp * 0.0020 * vec2(sin(uv.y * 23.0 - t * 1.1), cos(uv.x * 19.0 + t * 0.9));

  /* mouse ripples */
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (frag / uRes) * aspect;
  vec2 m = uMouse * aspect;
  vec2 dv = p - m;
  float d = length(dv);
  vec2 dir = d > 0.0001 ? dv / d : vec2(0.0);
  float ripple = sin(d * 38.0 - t * 4.0) * exp(-d * 4.5);
  vec2 push = dir * ripple * (0.004 + 0.012 * uStr) * uAmp;
  push.y *= -1.0;
  uv += push;

  /* chromatic split: sakitdə demək olar yoxdur, siçanla güclənir */
  float ca = 0.0003 + 0.006 * uStr * exp(-d * 3.0);
  vec2 cdir = vec2(dir.x, -dir.y);
  float r = texture2D(uTex, uv + cdir * ca).r;
  float g = texture2D(uTex, uv).g;
  float b = texture2D(uTex, uv - cdir * ca).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`;

export default function Hero3D({ src }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current!;
    const glc = glRef.current!;
    const fx = fxRef.current!;
    const ctx = fx.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.innerWidth < 820;

    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const gm = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, str: 0 };
    let dots: Dot[] = [];

    /* ───── WebGL ───── */
    const gl = glc.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    let prog: WebGLProgram | null = null;
    let tex: WebGLTexture | null = null;
    let imgW = 1, imgH = 1, ready = false;
    let readyAt = 0;
    const loc: Record<string, WebGLUniformLocation | null> = {};

    if (gl) {
      const sh = (type: number, srcText: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, srcText); gl.compileShader(s);
        return s;
      };
      prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const a = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
        ['uTex', 'uRes', 'uImg', 'uMouse', 'uTime', 'uStr', 'uAmp'].forEach((n) => { loc[n] = gl.getUniformLocation(prog!, n); });

        if (src) {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => {
            try {
              tex = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, tex);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              imgW = im.naturalWidth; imgH = im.naturalHeight;
              ready = true; readyAt = performance.now();
              glc.style.opacity = '1';
            } catch { ready = false; }
          };
          im.src = src;
        }
      }
    }

    /* ───── sizing ───── */
    const resize = () => {
      const r = box.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      glc.width = w * dpr; glc.height = h * dpr;
      fx.width = w * dpr; fx.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (gl) gl.viewport(0, 0, glc.width, glc.height);
      const count = mobile ? 26 : 56;
      dots = Array.from({ length: count }, () => {
        const big = Math.random() < 0.18;
        return {
          x: Math.random() * w, y: Math.random() * h,
          r: big ? 10 + Math.random() * 22 : 0.8 + Math.random() * 2.2,
          vy: -(0.08 + Math.random() * 0.25), vx: (Math.random() - 0.5) * 0.12,
          a: big ? 0.05 + Math.random() * 0.07 : 0.25 + Math.random() * 0.5,
          p: Math.random() * Math.PI * 2, big,
        };
      });
    };

    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      const r = box.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = 1 - (e.clientY - r.top) / r.height;
      const sp = Math.hypot(nx - gm.tx, ny - gm.ty);
      gm.str = Math.min(1, gm.str + sp * 5);
      gm.tx = nx; gm.ty = ny;
    };

    const ring = (cx: number, cy: number, rx: number, ry: number, rot: number, back: boolean) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rot, back ? Math.PI : 0, back ? Math.PI * 2 : Math.PI);
      ctx.stroke();
    };

    const drawFx = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * (mobile ? 0.11 : 0.115);
      const cx = w * (mobile ? 0.74 : 0.78) + mouse.x * -18;
      const cy = h * (mobile ? 0.22 : 0.3) + Math.sin(t * 0.6) * 8 + mouse.y * -12;

      /* halo (zəif) */
      ctx.globalCompositeOperation = 'lighter';
      const halo = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 3.6);
      halo.addColorStop(0, 'rgba(255, 150, 105, .22)');
      halo.addColorStop(0.45, 'rgba(232, 85, 58, .08)');
      halo.addColorStop(1, 'rgba(232, 85, 58, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, R * 3.6, 0, Math.PI * 2); ctx.fill();

      /* orbit, arxa yarı */
      const rot = -0.32 + Math.sin(t * 0.3) * 0.04;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 235, 215, .22)';
      ring(cx, cy, R * 1.9, R * 0.5, rot, true);
      ring(cx, cy, R * 2.45, R * 0.66, rot, true);

      /* orb gövdəsi: yarı şəffaf, kənarı yumşaq */
      ctx.globalCompositeOperation = 'source-over';
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
      body.addColorStop(0, 'rgba(255, 238, 210, .95)');
      body.addColorStop(0.35, 'rgba(255, 170, 115, .82)');
      body.addColorStop(0.75, 'rgba(232, 85, 58, .68)');
      body.addColorStop(0.94, 'rgba(170, 55, 40, .5)');
      body.addColorStop(1, 'rgba(150, 45, 36, 0)');
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      /* alt-sağda yumşaq kölgə: həcm hissi */
      const shade = ctx.createRadialGradient(cx + R * 0.45, cy + R * 0.5, R * 0.1, cx + R * 0.2, cy + R * 0.25, R * 1.1);
      shade.addColorStop(0, 'rgba(90, 20, 20, .28)');
      shade.addColorStop(1, 'rgba(90, 20, 20, 0)');
      ctx.fillStyle = shade;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      /* üst-solda kiçik parıltı */
      ctx.globalCompositeOperation = 'lighter';
      const spec = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, 0, cx - R * 0.38, cy - R * 0.42, R * 0.45);
      spec.addColorStop(0, 'rgba(255, 245, 230, .45)');
      spec.addColorStop(1, 'rgba(255, 245, 230, 0)');
      ctx.fillStyle = spec;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      /* nazik kənar işığı */
      const rim = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.02);
      rim.addColorStop(0, 'rgba(255,255,255,0)');
      rim.addColorStop(0.7, 'rgba(255,255,255,.12)');
      rim.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rim;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      /* orbit, ön yarı + peyk */
      ctx.strokeStyle = 'rgba(255, 245, 235, .5)';
      ring(cx, cy, R * 1.9, R * 0.5, rot, false);
      ctx.strokeStyle = 'rgba(255, 245, 235, .3)';
      ring(cx, cy, R * 2.45, R * 0.66, rot, false);

      const ang = t * 0.7;
      const sx = Math.cos(ang) * R * 2.45, sy = Math.sin(ang) * R * 0.66;
      const px = cx + sx * Math.cos(rot) - sy * Math.sin(rot);
      const py = cy + sx * Math.sin(rot) + sy * Math.cos(rot);
      if (Math.sin(ang) > 0 || Math.hypot(px - cx, py - cy) > R) {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(px, py, 0, px, py, 14);
        g.addColorStop(0, 'rgba(255,255,255,.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
      }

      /* bokeh */
      ctx.globalCompositeOperation = 'lighter';
      for (const d of dots) {
        if (!reduce) {
          d.y += d.vy; d.x += d.vx + mouse.x * 0.05 * (d.big ? 0.4 : 1);
          if (d.y < -40) { d.y = h + 40; d.x = Math.random() * w; }
          if (d.x < -40) d.x = w + 40;
          if (d.x > w + 40) d.x = -40;
        }
        const tw = 0.6 + 0.4 * Math.sin(t * 1.2 + d.p);
        const bx = d.x + mouse.x * (d.big ? 14 : 6), by = d.y + mouse.y * (d.big ? 10 : 4);
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, d.r);
        g.addColorStop(0, `rgba(255, 236, 215, ${d.a * tw})`);
        g.addColorStop(1, 'rgba(255, 236, 215, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(bx, by, d.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const drawGl = (t: number) => {
      if (!gl || !prog || !ready || !tex) return;
      gm.x += (gm.tx - gm.x) * 0.08;
      gm.y += (gm.ty - gm.y) * 0.08;
      gm.str *= 0.95;
      gl.useProgram(prog);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(loc.uTex, 0);
      gl.uniform2f(loc.uRes, glc.width, glc.height);
      gl.uniform2f(loc.uImg, imgW, imgH);
      gl.uniform2f(loc.uMouse, gm.x, gm.y);
      gl.uniform1f(loc.uTime, t);
      gl.uniform1f(loc.uStr, reduce ? 0 : gm.str);
      const amp = reduce ? 0 : Math.min(1, (performance.now() - readyAt) / 3000);
      gl.uniform1f(loc.uAmp, amp * amp * (3 - 2 * amp));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      const t = reduce ? 0 : time / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      drawGl(t);
      drawFx(t);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(box);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      io.disconnect();
      if (gl && tex) gl.deleteTexture(tex);
    };
  }, [src]);

  const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' } as const;
  return (
    <div ref={wrap} aria-hidden style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={glRef} style={{ ...fill, opacity: 0, transition: 'opacity 1.2s' }} />
      <canvas ref={fxRef} style={fill} />
    </div>
  );
}