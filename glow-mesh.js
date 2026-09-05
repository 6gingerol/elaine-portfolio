/* ============================================================
   glow-mesh.js — footer: Stripes + Stretch + Dither shader
   Full-coverage stripe pattern with cursor-driven stretch warp.
   ============================================================ */
(function () {
  var VERT = 'attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.,1.);}';

  var FRAG = [
    'precision highp float;',
    'uniform vec2 u_res;',
    'uniform vec2 u_mouse;',
    '',
    'float bayer4(vec2 p){',
    '  vec2 c=floor(mod(p,4.0));',
    '  int i=int(c.x)+int(c.y)*4;',
    '  float m=0.0;',
    '  if(i==0)m=0.0;else if(i==1)m=8.0;else if(i==2)m=2.0;else if(i==3)m=10.0;',
    '  else if(i==4)m=12.0;else if(i==5)m=4.0;else if(i==6)m=14.0;else if(i==7)m=6.0;',
    '  else if(i==8)m=3.0;else if(i==9)m=11.0;else if(i==10)m=1.0;else if(i==11)m=9.0;',
    '  else if(i==12)m=15.0;else if(i==13)m=7.0;else if(i==14)m=13.0;else if(i==15)m=5.0;',
    '  return m/16.0;',
    '}',
    '',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/u_res;',
    '  vec2 mouse=u_mouse/u_res;',
    '',
    '  // STRETCH — warp emanates from cursor',
    '  vec2 d=uv-mouse;',
    '  float dist=length(d);',
    '  float stretch=1.0/(1.0+dist/0.49);',
    '  vec2 suv=mouse+d*stretch;',
    '',
    '  // STRIPES',
    '  float angle=-14.0*3.14159/180.0;',
    '  float stripe=fract((suv.x*cos(angle)+suv.y*sin(angle))*4.0);',
    '  float s=smoothstep(0.77-0.285,0.77+0.285,stripe);',
    '',
    '  // DITHER',
    '  float dith=bayer4(gl_FragCoord.xy);',
    '  vec3 colorA=vec3(0.04,0.04,0.05);',
    '  vec3 colorB=vec3(0.78,0.78,0.76);',
    '  float blend=step(0.66,s+dith*0.5-0.25);',
    '  vec3 col=mix(colorA,colorB,blend);',
    '',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function initGlowMesh(host) {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    host.appendChild(canvas);

    // grain
    var noise = document.createElement('div');
    noise.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0.06;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E");';
    host.appendChild(noise);

    var gl = canvas.getContext('webgl', { alpha: false, antialias: false })
          || canvas.getContext('experimental-webgl', { alpha: false });
    if (!gl) return;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'u_res');
    var uMouse = gl.getUniformLocation(prog, 'u_mouse');

    var w = 0, h = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var mouseX = 0, mouseY = 0;
    var smoothX = 0, smoothY = 0;
    var inited = false;

    function measure() {
      var rect = host.getBoundingClientRect();
      w = Math.max(80, Math.floor(rect.width));
      h = Math.max(80, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (!inited) {
        smoothX = mouseX = w * 0.5;
        smoothY = mouseY = h * 0.5;
        inited = true;
      }
    }

    function onPointerMove(e) {
      var rect = host.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }

    function onPointerLeave() {
      mouseX = w * 0.5;
      mouseY = h * 0.5;
    }

    var raf;
    function render() {
      raf = requestAnimationFrame(render);
      smoothX += (mouseX - smoothX) * 0.035;
      smoothY += (mouseY - smoothY) * 0.035;
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uMouse, smoothX, h - smoothY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    measure();
    var footer = host.closest('.home-foot');
    if (footer) {
      footer.addEventListener('pointermove', onPointerMove);
      footer.addEventListener('pointerleave', onPointerLeave);
    }
    window.addEventListener('resize', measure);
    render();

    return function destroy() {
      cancelAnimationFrame(raf);
      if (footer) {
        footer.removeEventListener('pointermove', onPointerMove);
        footer.removeEventListener('pointerleave', onPointerLeave);
      }
      window.removeEventListener('resize', measure);
    };
  }

  function boot() {
    var hosts = document.querySelectorAll('.footer-glow-mesh');
    for (var i = 0; i < hosts.length; i++) {
      if (!hosts[i].__glowMesh) {
        hosts[i].__glowMesh = initGlowMesh(hosts[i]);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
