// The scenes and the shader deck for the browser demo: shaders/scene_flow.glsl, the Mandala
// side of shaders/scene_grid.glsl, shaders/deck_lens.glsl and three of the library's shaders
// (Oil slick and Prism rays, written for QRTZ, and VIDVOX's Kaleidoscope, MIT), with only the
// plumbing changed for WebGL 2: the inputs as samplers (uCrystal is the crystal over the dimmed
// picture with alpha marking the crystal, uPicture the picture, uLens the crystal over the
// picture at full brightness), the size as uRes, the pixel position as vUV, one output.

const HEAD = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform vec2 uRes;
uniform sampler2D uCrystal;
uniform sampler2D uPicture;
uniform sampler2D uLens;
`;

// deck_lens.glsl: the crystal over the picture at its own brightness.
const LENS = HEAD + `
uniform float uBackgroundDim;
void main() {
    vec4 crystal = texture(uCrystal, vUV);
    vec3 picture = texture(uPicture, vUV).rgb;
    float missing = (1.0 - crystal.a) * (1.0 - clamp(uBackgroundDim, 0.0, 1.0));
    fragColor = vec4(crystal.rgb + picture * missing, 1.0);
}`;

// A crossfade between two pictures.
const MIX = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uMix;
void main() {
    fragColor = mix(texture(uA, vUV), texture(uB, vUV), uMix);
}`;

// scene_flow.glsl.
const FLOW = HEAD + `
uniform float uFlow;
uniform float uTurn;
uniform float uPulse;
uniform float uSparkle;
uniform float uStyleA;
uniform float uStyleB;
uniform float uStyleMix;
uniform float uInvert;
uniform float uRibbons;
uniform float uWidth;
uniform float uBend;
uniform float uPictureShow;
uniform float uCrystalShow;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

const float GRADIENT_STEP = 0.012;

float crystalAt(vec2 uv) {
    return texture(uCrystal, uv).a;
}

vec3 palette(float x) {
    x = clamp(x, 0.0, 1.0) * 2.0;
    return x < 1.0 ? mix(uColor1, uColor2, x) : mix(uColor2, uColor3, x - 1.0);
}

vec3 ribbonsAlong(vec2 q, bool wrap, float wobble) {
    int count = int(uRibbons + 0.5);
    vec3 ribbons = vec3(0.0);
    for (int i = 0; i < 12; i++) {
        if (i >= count) break;
        float n = float(i);
        float along = (n + 0.5) / float(count);
        float center = (along - 0.5) * 1.15
            + wobble * (0.16 * sin(q.x * 1.6 + uFlow * 0.9 + n * 1.3)
                        + 0.06 * sin(q.x * 3.6 - uFlow * 1.4 + n * 2.1));
        float width = uWidth * (0.75 + 0.4 * sin(q.x * 2.0 + uFlow + n));
        float across = q.y - center;
        if (wrap) across = mod(across + 0.575, 1.15) - 0.575;
        float away = across / width;
        ribbons += palette(mix(along, 1.0 - along, uInvert))
            * (0.45 * exp(-away * away) + (0.25 + uSparkle) * exp(-away * away * 9.0));
    }
    return ribbons;
}

vec2 tunnelPosition(vec2 p) {
    return vec2(atan(p.y, p.x) * 5.0, log(max(length(p), 0.01)) * 0.9 - uFlow * 0.5);
}

float tunnelNear(vec2 p) {
    return mix(0.15, 1.0, smoothstep(-3.5, -0.3, log(max(length(p), 0.01))));
}

vec3 tunnelField(vec2 p) {
    return ribbonsAlong(tunnelPosition(p), true, 0.08) * tunnelNear(p);
}

vec3 weaveToTunnel(vec2 p, float t) {
    vec2 rings = tunnelPosition(p);
    float across = mix(p.y, rings.y, t);
    float wobble = mix(1.0, 0.08, t);
    vec3 curling = mix(ribbonsAlong(vec2(p.x, across), t > 0.001, wobble),
                       ribbonsAlong(vec2(rings.x, across), t > 0.001, wobble), t)
        * mix(0.6, 1.0, t) * mix(1.0, tunnelNear(p), t);
    vec3 hanging = ribbonsAlong(p.yx, false, 1.0) * 0.6 * (1.0 - t);
    return curling + hanging;
}

vec3 ribbonField(float style, vec2 p) {
    int kind = int(style + 0.5);
    if (kind == 4) {
        return (ribbonsAlong(p, false, 1.0) + ribbonsAlong(p.yx, false, 1.0)) * 0.6;
    }
    if (kind == 5) {
        return tunnelField(p);
    }
    vec2 q = p;
    if (kind == 1) {
        q = p.yx;
    } else if (kind >= 2) {
        float around = atan(p.y, p.x);
        float outward = length(p) * 1.5 - 0.75;
        if (kind == 3) {
            outward += around / 6.28318 * 2.0 * 1.15 / float(int(uRibbons + 0.5));
        }
        q = vec2(around * 5.0, outward);
    }
    return ribbonsAlong(q, false, 1.0);
}

void main() {
    float aspect = uRes.x / uRes.y;
    vec2 uv = vUV;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float c = cos(uTurn * 0.3), s = sin(uTurn * 0.3);
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    vec2 slope = vec2(crystalAt(uv + vec2(GRADIENT_STEP, 0.0)) - crystalAt(uv - vec2(GRADIENT_STEP, 0.0)),
                      crystalAt(uv + vec2(0.0, GRADIENT_STEP)) - crystalAt(uv - vec2(0.0, GRADIENT_STEP)));
    p += slope * uBend;
    int styleA = int(uStyleA + 0.5), styleB = int(uStyleB + 0.5);
    vec3 ribbons;
    if (uStyleMix < 0.001) {
        ribbons = ribbonField(uStyleA, p);
    } else if (styleA == 4 && styleB == 5) {
        ribbons = weaveToTunnel(p, uStyleMix);
    } else if (styleA == 5 && styleB == 4) {
        ribbons = weaveToTunnel(p, 1.0 - uStyleMix);
    } else {
        ribbons = mix(ribbonField(uStyleA, p), ribbonField(uStyleB, p), uStyleMix);
    }
    vec3 color = mix(uColor0, texture(uPicture, uv).rgb, uPictureShow) + ribbons;
    vec4 crystal = texture(uCrystal, uv);
    color = mix(color, crystal.rgb, crystal.a * uCrystalShow);
    fragColor = vec4(color, 1.0);
}`;

// scene_grid.glsl, as the Mandala scene uses it (the mirrors filled with marbled paint).
const MANDALA = HEAD + `
uniform float uCells;
uniform float uShape;
uniform float uWedges;
uniform float uCellsB;
uniform float uShapeB;
uniform float uWedgesB;
uniform float uLookMix;
uniform float uKick;
uniform float uKickTwist;
uniform float uKickOpen;
uniform float uLineWidth;
uniform float uLineDark;
uniform float uLineShow;
uniform float uStep;
uniform float uTurn;
uniform float uViewTurn;
uniform float uSparkle;
uniform float uSparkleGlow;
uniform float uFacetView;
uniform float uFacetFloor;
uniform float uFacetWander;
uniform float uPlain;
uniform float uMandala;
uniform float uFlow;
uniform float uPaintZoom;
uniform float uPaintBands;
uniform float uPaintDrift;
uniform float uPaintLines;
uniform float uPaintPicture;
uniform float uPaintBlur;
uniform float uPaintRich;
uniform float uPaintLift;
uniform float uPaintShards;
uniform vec3 uPaint0;
uniform vec3 uPaint1;
uniform vec3 uPaint2;
uniform vec3 uPaint3;
uniform vec3 uPaint4;
uniform vec3 uPaint5;

const int SHAPE_HEXAGON = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND = 3;
const int SHAPE_RADIAL = 4;
const float TRIANGLE_HEIGHT = 0.8660254;
const float HEXAGON_ROW = 1.7320508;
const float TWO_PI = 6.2831853;
const int PAINT_FOLDS = 9;
const int PICTURE_FOLD = 3;

vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

vec2 squareTile(vec2 grid, out vec2 id, out float edge) {
    vec2 shifted = grid + 0.5;
    vec2 cell = floor(shifted);
    vec2 inTile = shifted - cell - 0.5;
    vec2 fromEdge = 0.5 - abs(inTile);
    edge = min(fromEdge.x, fromEdge.y);
    id = floor(cell / 2.0);
    return inTile * (mod(cell, 2.0) * 2.0 - 1.0);
}

vec2 hexagonTile(vec2 grid, out vec2 id, out float edge) {
    vec2 size = vec2(1.0, HEXAGON_ROW);
    vec2 a = mod(grid, size) - size * 0.5;
    vec2 b = mod(grid - size * 0.5, size) - size * 0.5;
    vec2 inTile = dot(a, a) < dot(b, b) ? a : b;
    id = floor(grid - inTile + 0.5);
    vec2 h = abs(inTile);
    edge = 0.5 - max(h.x, dot(h, vec2(0.5, TRIANGLE_HEIGHT)));
    return inTile;
}

vec2 triangleTile(vec2 grid, out vec2 id, out float edge) {
    float row = floor(grid.y / TRIANGLE_HEIGHT);
    vec2 inRow = vec2(grid.x - 0.5 * mod(row, 2.0), grid.y - row * TRIANGLE_HEIGHT);
    float column = floor(inRow.x);
    vec2 f = vec2(inRow.x - column, inRow.y);
    bool up = abs(f.x - 0.5) < 0.5 * (1.0 - f.y / TRIANGLE_HEIGHT);
    vec2 inTile;
    if (up) {
        inTile = f - vec2(0.5, TRIANGLE_HEIGHT / 3.0);
    } else {
        inTile = f - vec2(f.x < 0.5 ? 0.0 : 1.0, TRIANGLE_HEIGHT * 2.0 / 3.0);
        inTile.y = -inTile.y;
    }
    edge = 0.2886751 - max(-inTile.y, TRIANGLE_HEIGHT * abs(inTile.x) + 0.5 * inTile.y);
    id = vec2(column * 2.0 + (up ? 0.0 : (f.x < 0.5 ? -1.0 : 1.0)), row);
    return vec2(inTile.y, -inTile.x);
}

float keepDetail(float change, float from, float to) {
    return 1.0 - smoothstep(from, to, change);
}

vec3 paintAt(int index) {
    if (index == 0) return uPaint0;
    if (index == 1) return uPaint1;
    if (index == 2) return uPaint2;
    if (index == 3) return uPaint3;
    if (index == 4) return uPaint4;
    return uPaint5;
}

vec3 paintColor(float x, float change) {
    float at = fract(x) * 6.0;
    int index = int(at);
    float part = at - float(index);
    float outline = smoothstep(0.0, 0.07, min(part, 1.0 - part));
    outline = mix(1.0, outline, keepDetail(change, 0.2, 0.7));
    return mix(paintAt(index), paintAt((index + 1) % 6), smoothstep(0.25, 0.75, part)) * mix(0.1, 1.0, outline);
}

vec3 marble(vec2 p) {
    float drift = uFlow * uPaintDrift;
    vec2 bend = vec2(0.56 + 0.05 * sin(drift), 0.47 + 0.05 * cos(drift * 0.73));
    float fromCenter = length(p);
    vec2 q = p / max(fromCenter, 0.001) * log(1.0 + fromCenter * 6.0) * uPaintZoom + vec2(0.31, 0.17);
    float last = length(q);
    float total = 0.0;
    float nearest = 1e9;
    vec2 inPicture = vec2(0.0);
    for (int i = 0; i < PAINT_FOLDS; i++) {
        q = abs(q) / max(dot(q, q), 0.02) - bend;
        if (i == PICTURE_FOLD) inPicture = q;
        float now = length(q);
        total += abs(now - last);
        nearest = min(nearest, abs(now - 0.8));
        last = now;
    }
    float bands = log(1.0 + total) * uPaintBands;
    float change = fwidth(bands * 6.0);
    vec3 color = paintColor(bands, change);
    if (uPaintPicture > 0.001) {
        vec2 inImage = inPicture * 0.3 + 0.5;
        vec2 across = dFdx(inImage) * uRes;
        vec2 down = dFdy(inImage) * uRes;
        float blur = 0.5 * log2(max(max(dot(across, across), dot(down, down)), 1.0));
        vec3 picture = textureLod(uPicture, 1.0 - abs(1.0 - mod(inImage, 2.0)), min(blur, uPaintBlur)).rgb;
        float gray = dot(picture, vec3(0.3, 0.6, 0.1));
        picture = pow(max(mix(vec3(gray), picture, uPaintRich), vec3(0.0)), vec3(1.0 / uPaintLift));
        float part = fract(bands * 6.0);
        float light = mix(0.95, mix(0.65, 1.25, 0.5 + 0.5 * cos(bands * 37.7)), keepDetail(change, 0.08, 0.3));
        float outline = mix(1.0, smoothstep(0.0, 0.07, min(part, 1.0 - part)), keepDetail(change, 0.2, 0.7));
        picture *= light * mix(0.1, 1.0, outline);
        color = mix(color, picture, uPaintPicture);
    }
    color *= mix(1.0, smoothstep(0.0, 0.12, nearest), uPaintLines * keepDetail(fwidth(nearest), 0.05, 0.18));
    return color;
}

vec3 smoothMarble(vec2 p, float pixel) {
    return 0.25 * (marble(p + pixel * vec2(0.125, 0.375)) + marble(p + pixel * vec2(-0.375, 0.125))
                 + marble(p + pixel * vec2(0.375, -0.125)) + marble(p + pixel * vec2(-0.125, -0.375)));
}

vec3 sharpTexture(vec2 uv) {
    vec2 size = uRes;
    vec2 at = uv * size;
    vec2 base = floor(at - 0.5) + 0.5;
    vec2 f = at - base;
    vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
    vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
    vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
    vec2 w3 = f * f * (-0.5 + 0.5 * f);
    vec2 w12 = w1 + w2;
    vec2 p0 = (base - 1.0) / size;
    vec2 p12 = (base + w2 / w12) / size;
    vec2 p3 = (base + 2.0) / size;
    vec3 sum = texture(uCrystal, vec2(p12.x, p0.y)).rgb * w12.x * w0.y
             + texture(uCrystal, vec2(p0.x, p12.y)).rgb * w0.x * w12.y
             + texture(uCrystal, p12).rgb * w12.x * w12.y
             + texture(uCrystal, vec2(p3.x, p12.y)).rgb * w3.x * w12.y
             + texture(uCrystal, vec2(p12.x, p3.y)).rgb * w12.x * w3.y;
    float total = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;
    return max(sum / total, vec3(0.0));
}

vec3 pattern(vec2 p, float aspect, float cells, int shape, float wedges) {
    vec2 grid = p * cells;
    vec2 id = vec2(0.0);
    float edge = 1.0;
    vec2 inTile = grid;
    if (shape == SHAPE_HEXAGON) {
        inTile = hexagonTile(grid, id, edge);
    } else if (shape == SHAPE_TRIANGLE) {
        inTile = triangleTile(grid, id, edge);
    } else if (shape == SHAPE_DIAMOND) {
        inTile = squareTile(vec2(grid.x + grid.y, grid.y - grid.x) * 0.7071068, id, edge);
    } else if (shape != SHAPE_RADIAL) {
        inTile = squareTile(grid, id, edge);
    }
    if (wedges > 0.5) {
        float wedge = TWO_PI / wedges;
        float around = abs(mod(atan(inTile.y, inTile.x), wedge) - wedge * 0.5);
        float fromCenter = length(inTile);
        inTile = fromCenter * vec2(cos(around), sin(around));
        id = vec2(0.0);
        if (shape == SHAPE_RADIAL) {
            edge = fromCenter * min(sin(around), sin(wedge * 0.5 - around));
        }
    }
    float viewAngle = uTurn * uViewTurn + uKick * uKickTwist;
    float vc = cos(viewAngle), vs = sin(viewAngle);
    inTile = vec2(vc * inTile.x - vs * inTile.y, vs * inTile.x + vc * inTile.y) * (1.0 - uKick * uKickOpen);
    float step_ = floor(uStep);
    vec2 view = mix(hash2(id + step_ * vec2(1.0, 7.0)), hash2(id + (step_ + 1.0) * vec2(1.0, 7.0)), fract(uStep));
    float viewSize = max(uFacetView, uFacetFloor / cells);
    vec2 crystal = 0.5 + (view - 0.5) * uFacetWander + inTile * viewSize * vec2(1.0 / aspect, 1.0);
    crystal = 1.0 - abs(1.0 - mod(crystal, 2.0));
    if (uMandala > 0.001) {
        vec4 seen = texture(uCrystal, crystal);
        return mix(seen.rgb, mix(smoothMarble(inTile, cells * uFacetView / uRes.y), seen.rgb, seen.a * uPaintShards), uMandala);
    }
    return sharpTexture(crystal) * (1.0 - uLineDark * uLineShow * (1.0 - smoothstep(0.0, uLineWidth, edge)));
}

void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUV - 0.5) * vec2(aspect, 1.0);
    float c = cos(uTurn), s = sin(uTurn);
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    vec3 color = pattern(p, aspect, uCells, int(uShape + 0.5), uWedges);
    if (uLookMix > 0.001) {
        color = mix(color, pattern(p, aspect, uCellsB, int(uShapeB + 0.5), uWedgesB), uLookMix);
    }
    color = mix(color, texture(uCrystal, vUV).rgb, uPlain);
    float bright = dot(color, vec3(0.3, 0.6, 0.1));
    color += color * pow(bright, 3.0) * uSparkle * uSparkleGlow;
    fragColor = vec4(color, 1.0);
}`;

// The shader deck's shared uniforms, as shader_deck.py declares them.
const DECK_HEAD = HEAD + `
uniform float uTime;
uniform float uPulse;
uniform float uBar;
uniform float uBarPhase;
uniform float uBass;
uniform float uMids;
uniform float uTreble;
uniform float uDrop;
uniform float uFlow;
uniform float uTurn;
uniform float uSparkle;
uniform float uEnergy;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
`;

// shaders/library/oil_slick.glsl (QRTZ, MIT).
const OIL_SLICK = DECK_HEAD + `
uniform float bands;
uniform float amount;
uniform float swirl;
uniform float flow;
uniform float palette;
uniform float sharp;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const float SOFT_PX = 6.0;
const float CRYSTAL_THIN = 0.5;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

vec3 paletteAt(float x) {
    x = fract(x) * 4.0;
    if (x < 1.0) return mix(uColor0, uColor1, x);
    if (x < 2.0) return mix(uColor1, uColor2, x - 1.0);
    if (x < 3.0) return mix(uColor2, uColor3, x - 2.0);
    return mix(uColor3, uColor0, x - 3.0);
}

void main() {
    vec2 uv = vUV;
    float aspect = uRes.x / uRes.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    vec2 drift = vec2(noise(p * 2.5 + uFlow * 0.15), noise(p * 2.5 + 17.0 - uFlow * 0.15)) - 0.5;
    vec2 at = clamp(uv + drift * swirl * (1.0 + 2.0 * uBass) / vec2(aspect, 1.0), 0.0, 1.0);
    vec3 here = texture(uLens, at).rgb;
    float bright = dot(here, LUMA);
    vec2 px = 1.0 / uRes;
    float soft = bright * 0.2;
    for (int i = 0; i < 4; i++) {
        float a = 1.5708 * float(i) + 0.785;
        soft += 0.2 * dot(texture(uLens, at + vec2(cos(a), sin(a)) * SOFT_PX * px).rgb, LUMA);
    }
    float count = bands * (1.0 + uDrop);
    float thickness = soft * count + uFlow * flow + 0.15 * uPulse + 0.6 * noise(p * 1.5 - uFlow * 0.05);
    vec3 film = 0.5 + 0.5 * cos(6.2831 * (thickness * vec3(1.0, 1.12, 1.27)) + vec3(0.0, 2.1, 4.2));
    film = pow(film, vec3(1.0 + 2.0 * sharp * uSparkle));
    film = mix(film, paletteAt(thickness * 0.5), palette);
    film *= bright / max(dot(film, LUMA), 0.03);
    float show = amount * (1.0 - CRYSTAL_THIN * texture(uCrystal, uv).a);
    vec3 c = mix(here, film, show);
    fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

// shaders/library/prism_rays.glsl (QRTZ, MIT).
const PRISM_RAYS = DECK_HEAD + `
uniform float rays;
uniform float glow;
uniform float spread;
uniform float picture;

const int TAPS = 18;

vec3 palette(float x) {
    x = clamp(x, 0.0, 1.0) * 3.0;
    if (x < 1.0) return mix(uColor0, uColor1, x);
    if (x < 2.0) return mix(uColor1, uColor2, x - 1.0);
    return mix(uColor2, uColor3, x - 2.0);
}

void main() {
    vec2 uv = vUV;
    float aspect = uRes.x / uRes.y;
    vec2 fromMiddle = (uv - 0.5) * vec2(aspect, 1.0);
    float away = length(fromMiddle);
    float reach = rays * (0.5 + 0.5 * uBass);
    vec3 light = vec3(0.0);
    float total = 0.0;
    for (int i = 0; i < TAPS; i++) {
        float k = float(i) / float(TAPS - 1);
        vec2 p = uv - (uv - 0.5) * reach * k;
        vec4 c = texture(uCrystal, p);
        float bright = max(max(c.r, c.g), c.b) * c.a;
        float w = 1.0 - k * 0.8;
        vec3 tint = palette(fract(0.35 + k * spread + away * 0.4 + uTurn * 0.08));
        light += tint * bright * w;
        total += w;
    }
    light /= total;
    float shimmer = 1.0 + 0.3 * uTreble * sin(away * 60.0 - uTime * 9.0 + uTurn * 4.0);
    light *= glow * shimmer * (1.0 + 0.15 * uPulse) * (1.0 - smoothstep(0.55, 0.9, away) * 0.6);
    vec3 color = texture(uPicture, uv).rgb * picture * (1.0 - 0.3 * uDrop) + light;
    vec4 crystal = texture(uCrystal, uv);
    color = mix(color, crystal.rgb, crystal.a);
    fragColor = vec4(color, 1.0);
}`;

// shaders/library/Kaleidoscope.fs, by VIDVOX (ISF-Files, MIT): the crystal over the picture
// folded into mirrored wedges.
const KALEIDOSCOPE = DECK_HEAD + `
uniform float sides;
uniform float angle;
uniform float slidex;
uniform float slidey;
uniform vec2 center;

const float tau = 6.28318530718;

void main() {
    vec2 loc = uRes * vUV;
    float r = distance(center * uRes, loc);
    float a = atan((loc.y - center.y * uRes.y), (loc.x - center.x * uRes.x));
    a = mod(a, tau / sides);
    a = abs(a - tau / sides / 2.);
    loc.x = r * cos(a + tau * angle);
    loc.y = r * sin(a + tau * angle);
    loc = (center * uRes + loc) / uRes;
    loc.x = mod(loc.x + slidex, 1.0);
    loc.y = mod(loc.y + slidey, 1.0);
    if (loc.x < 0.0) loc.x = mod(abs(loc.x), 1.0);
    if (loc.y < 0.0) loc.y = mod(abs(loc.y), 1.0);
    if (loc.x > 1.0) loc.x = mod(abs(1.0 - loc.x), 1.0);
    if (loc.y > 1.0) loc.y = mod(abs(1.0 - loc.y), 1.0);
    fragColor = texture(uLens, loc);
}`;

window.QRTZ_SCENES = { LENS, MIX, FLOW, MANDALA, OIL_SLICK, PRISM_RAYS, KALEIDOSCOPE };
