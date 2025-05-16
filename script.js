const canvas = document.getElementById('shader-bg-canvas');
const sandbox = new GlslCanvas(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const d = new Date();
sandbox.setUniform("u_resolution", canvas.width, canvas.height);
sandbox.setUniform("u_time", d.getTime());

sandbox.load(`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution; // larghezza, altezza in pixel
uniform float u_time;      // tempo in secondi

const float g_threshold = 0.9985;
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
    float c = Pseudo2dNoise(pos.xy);
    return (c < threshold) ? 0.0 : c;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    // sfondo cielo con gradiente verticale
    float t = pow(smoothstep(0.0, 1.0, uv.y), 0.8);
    vec3 col = mix(g_BottomColor, g_TopColor, t);
    // aggiungi stelle modulate da rumore simplex
    float star = getStar(vec3(uv, u_time), g_threshold);
    float neb  = simplex3d(vec3(uv * 100.0, u_time));
    col += star * g_StarColor * (neb + 0.4) / 1.4;
    gl_FragColor = vec4(col, 1.0);
}
  `);
