const canvas = document.getElementById('shader-bg-canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    alert('WebGL not supported');
}

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Shader sources
const vertSrc = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

const fragSrc = `
    #ifdef GL_ES
    precision highp float;
    #endif

    uniform vec2 u_resolution; // larghezza, altezza in pixel
    uniform float u_time;      // tempo in secondi
    uniform float u_seed;

    const float g_threshold = 0.7;
    const vec3  g_TopColor   = vec3(0.0235, 0.0235, 0.1412);
    const vec3  g_BottomColor   = vec3(0.0, 0.0, 0.0);
    const vec3  g_StarColor  = vec3(1.0, 1.0, 1.0);

    // discontinuous pseudorandom in [-0.5,+0.5]^3
    vec3 random3(vec3 c) {
        float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));
        vec3 r;
        r.z = fract(512.0 * j);
        j   *= 0.125;
        r.x = fract(512.0 * j);
        j   *= 0.125;
        r.y = fract(512.0 * j);
        return r - 0.5;
    }

    // skew constants per simplex 3D
    const float F3 = 1.0 / 3.0;
    const float G3 = 1.0 / 6.0;

    // 3D simplex noise
    float simplex3d(vec3 p) {
        vec3 s = floor(p + dot(p, vec3(F3)));
        vec3 x = p - s + dot(s, vec3(G3));

        vec3 e = step(vec3(0.0), x - x.yzx);
        vec3 i1 = e * (1.0 - e.zxy);
        vec3 i2 = 1.0 - e.zxy * (1.0 - e);

        vec3 x1 = x - i1 + G3;
        vec3 x2 = x - i2 + 2.0 * G3;
        vec3 x3 = x - 1.0 + 3.0 * G3;

        vec4 w;
        w.x = dot(x,  x);
        w.y = dot(x1, x1);
        w.z = dot(x2, x2);
        w.w = dot(x3, x3);

        w = max(0.6 - w, 0.0);
        w *= w * w * w; // w^4

        vec4 d;
        d.x = dot(random3(s),       x);
        d.y = dot(random3(s + i1),  x1);
        d.z = dot(random3(s + i2),  x2);
        d.w = dot(random3(s + 1.0), x3);

        return dot(d * w, vec4(52.0));
    }

    // hash-based pseudo-noise 3D
    float Pseudo3dNoise(vec3 pos) {
        float hash = sin(pos.x * 15.234) + exp(pos.x);
        hash += cos(pos.y * 965.235) + exp(pos.y);
        hash += cos(pos.z * 35.5) + exp(pos.z);
        return fract(3854.2345 * hash);
    }

    // hash-based pseudo-noise 2D
    float Pseudo2dNoise(vec2 pos) {
        float hash = sin(pos.x * 15.234) + exp(pos.x);
        hash += cos(pos.y * 965.235) + exp(pos.y);
        return fract(3854.2345 * hash);
    }

    // genera una “stella” se il valore supera la soglia
    float getStar(vec3 pos, float threshold) {
        float c = simplex3d(vec3(pos.xy, u_seed));
        return (c < threshold) ? 0.0 : c;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 noiseCoord = gl_FragCoord.xy / u_resolution.x;

        // sfondo cielo con gradiente verticale
        float t = pow(smoothstep(0.0, 1.0, uv.y), 0.8);
        vec3 col = mix(g_BottomColor, g_TopColor, t);
        // aggiungi stelle modulate da rumore simplex
        float star = getStar(vec3(noiseCoord * 150.0, u_time), g_threshold);
        float fog = simplex3d(vec3(noiseCoord * 80.0, u_time * 0.4));
        col += star * g_StarColor * (fog + 0.4) / 1.3;

        gl_FragColor = vec4(col, 1.0);
    }
    `;

function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vert = createShader(gl.VERTEX_SHADER, vertSrc);
const frag = createShader(gl.FRAGMENT_SHADER, fragSrc);

const program = gl.createProgram();
gl.attachShader(program, vert);
gl.attachShader(program, frag);
gl.bindAttribLocation(program, 0, 'a_position'); // attrib 0 fix
gl.linkProgram(program);
gl.useProgram(program);

// Triangle strip covering the whole screen
const quad = new Float32Array([
    -1, -1,
    1, -1,
    -1,  1,
    1,  1,
]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

// Uniform locations
const u_time = gl.getUniformLocation(program, 'u_time');
const u_res = gl.getUniformLocation(program, 'u_resolution');
const u_seed = gl.getUniformLocation(program, 'u_seed');

gl.uniform1f(u_seed, Math.random());

// Animation loop
let start = performance.now();
function render() {
    const now = (performance.now() - start) * 0.001;
    gl.uniform1f(u_time, now);
    gl.uniform2f(u_res, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}

render();
