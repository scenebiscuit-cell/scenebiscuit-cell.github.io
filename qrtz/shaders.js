// The QRTZ crystal for the browser: the TouchDesigner shaders (shaders/crystal_gem.glsl,
// crystal_refract.glsl and crystal_shatter.glsl) with only what WebGL 2 needs changed: the
// picture comes in as uPicture, the output size as uRes, the pixel position as vUV, and there
// is one output. Kept as JavaScript strings so the page opens from a plain file too.
//
// Three passes: the picture (a bundled procedural one, or the visitor's image), the gem on a
// clear background, and the gem over the picture, broken into shards when it explodes.

const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUV;
void main() {
    vUV = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// A picture to refract when the visitor hasn't opened one: soft shapes of light in a dark
// room, in the palette's colors, drifting slowly. Dim on purpose, like no_photo.glsl.
const PICTURE = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

float blob(vec2 p, vec2 c, float r) {
    return smoothstep(r, 0.0, length(p - c));
}

void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUV - 0.5) * vec2(aspect, 1.0);
    float t = uTime * 0.05;
    vec3 color = mix(uColor0, uColor1, vUV.y) * 0.35;
    color += uColor2 * 0.9 * blob(p, vec2(sin(t * 1.3) * 0.5, cos(t * 0.9) * 0.3), 0.55);
    color += uColor3 * 0.9 * blob(p, vec2(cos(t * 0.7) * 0.6, sin(t * 1.1) * 0.35), 0.5);
    color += uColor1 * 0.7 * blob(p, vec2(sin(t * 0.5 + 2.0) * 0.7, cos(t * 1.7) * 0.4), 0.4);
    // Fine lines, so the crystal has something to bend.
    float lines = 0.5 + 0.5 * sin(p.x * 40.0 + sin(p.y * 6.0 + t * 3.0) * 2.0);
    color += vec3(0.12) * smoothstep(0.75, 1.0, lines) * (0.5 + 0.5 * sin(p.y * 3.0 + t));
    float vignette = 1.0 - 0.5 * smoothstep(0.3, 0.9, length(p));
    fragColor = vec4(color * vignette, 1.0);
}`;

// crystal_gem.glsl and crystal_refract.glsl, joined.
const GEM = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uPicture;
uniform vec2 uRes;

uniform float uAngle;
uniform float uTilt;
uniform float uRoll;
uniform float uFacetBase;
uniform float uFacetContrast;
uniform float uGemEdge;
uniform float uGlintGain;
uniform float uSize;
uniform float uIor;
uniform float uRefraction;
uniform float uDispersion;
uniform float uBreathe;
uniform float uSparkle;
uniform float uShapeA;
uniform float uShapeB;
uniform float uMorph;
uniform float uScale;
uniform float uOffsetX;
uniform float uOffsetY;
uniform float uCameraDistance;
uniform float uLens;
uniform float uSamples;
uniform float uToSphere;
uniform float uSphereSize;
uniform float uDiscoRows;
uniform float uDiscoSize;
uniform float uDiscoGrout;
uniform float uDiscoScatter;
uniform float uDiscoTwinkle;
uniform float uDiscoBubble;

const float PI = 3.14159265;
const float FAR = 1e5;
const vec2 SAMPLE_OFFSETS[4] = vec2[](vec2(-0.375, -0.125), vec2(0.125, -0.375),
                                      vec2(0.375, 0.125), vec2(-0.125, 0.375));

vec2 sampleUV(int which, int samples) {
    return vUV + (samples > 1 ? SAMPLE_OFFSETS[which] : vec2(0.0)) / uRes;
}
const int RING = 8;
const int NUM_PLANES = 1 + 3 * RING;
const int MAX_BOUNCES = 4;
const float UNUSED_PLANE = 6.0;

const int SHAPE_BRILLIANT = 0;
const int SHAPE_QUARTZ = 1;
const int SHAPE_OCTAHEDRON = 2;
const int SHAPE_EMERALD = 3;
const int SHAPE_DISCO = 4;

vec3 planeNormals[NUM_PLANES];
float planeDists[NUM_PLANES];

float planeScale = 1.0;
float sphereRadius = 0.0;
float breathe = 0.0;

mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1.0, 0.0, 0.0,  0.0, c, s,  0.0, -s, c);
}

mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0.0, -s,  0.0, 1.0, 0.0,  s, 0.0, c);
}

mat3 rotateZ(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, s, 0.0,  -s, c, 0.0,  0.0, 0.0, 1.0);
}

vec3 ringNormal(float angle, float out_, float up) {
    return normalize(vec3(cos(angle) * out_, up, sin(angle) * out_));
}

void shapePlane(int shape, int ring, int i, out vec3 normal, out float dist) {
    float step45 = 2.0 * PI / float(RING);
    float a = float(i) * step45;
    normal = ringNormal(a, ring == 1 ? 1.0 : 0.7, ring == 0 ? 0.7 : (ring == 2 ? -0.7 : 0.0));
    dist = UNUSED_PLANE;

    if (shape == SHAPE_BRILLIANT || shape >= SHAPE_DISCO) {
        float offset = (float(i) + 0.5) * step45;
        if (ring == 0) { normal = ringNormal(offset, 0.62, 0.78); dist = 0.74; }
        if (ring == 1) { normal = ringNormal(a, 1.0, 0.04); dist = 0.82; }
        if (ring == 2) { normal = ringNormal(offset, 0.76, -0.65); dist = 0.70; }
    } else if (shape == SHAPE_QUARTZ) {
        if (i < 6) {
            float side = float(i) * PI / 3.0;
            if (ring == 0) { normal = ringNormal(side, 0.625, 0.781); dist = 0.742; }
            if (ring == 1) { normal = ringNormal(side, 1.0, 0.0); dist = 0.5; }
            if (ring == 2) { normal = ringNormal(side, 0.574, -0.819); dist = 0.656; }
        }
    } else if (shape == SHAPE_OCTAHEDRON) {
        if (i < 4 && ring != 1) {
            float side = (float(i) + 0.5) * PI / 2.0;
            normal = ringNormal(side, 0.765, ring == 0 ? 0.644 : -0.644);
            dist = 0.612;
        }
    } else {
        float reach = 0.806;
        if (i % 4 == 0) reach = 0.85;
        if (i % 4 == 2) reach = 0.55;
        if (ring == 0) { normal = ringNormal(a, 0.6, 0.8); dist = 0.6 * reach + 0.12; }
        if (ring == 1) { normal = ringNormal(a, 1.0, 0.0); dist = reach; }
        if (ring == 2) { normal = ringNormal(a, 0.65, -0.76); dist = 0.65 * reach + 0.038; }
    }
}

float tableHeight(int shape) {
    if (shape == SHAPE_BRILLIANT || shape >= SHAPE_DISCO) return 0.42;
    if (shape == SHAPE_EMERALD) return 0.38;
    return UNUSED_PLANE;
}

const float SWELL_GROW = 0.3;

void buildGem(float swell) {
    breathe = swell;
    int shapeA = int(uShapeA + 0.5);
    int shapeB = int(uShapeB + 0.5);
    bool morphing = uMorph > 0.0;

    planeNormals[0] = vec3(0.0, 1.0, 0.0);
    float size = uSize * uScale * (1.0 + SWELL_GROW * max(swell, 0.0));
    planeDists[0] = mix(tableHeight(shapeA), tableHeight(shapeB), uMorph) * size;

    for (int ring = 0; ring < 3; ring++) {
        for (int i = 0; i < RING; i++) {
            vec3 normal, normalB;
            float dist, distB;
            shapePlane(shapeA, ring, i, normal, dist);
            if (morphing) {
                shapePlane(shapeB, ring, i, normalB, distB);
                normal = normalize(mix(normal, normalB, uMorph) + vec3(0.0, 1e-4, 0.0));
                dist = mix(dist, distB, uMorph);
            }
            int index = 1 + ring * RING + i;
            planeNormals[index] = normal;
            planeDists[index] = dist * size;
        }
    }
}

bool hitGem(vec3 ro, vec3 rd, out float tEnter, out float tExit, out vec3 normal, out float edgeDist) {
    tEnter = -FAR;
    tExit = FAR;
    float tSecond = -FAR;
    normal = vec3(0.0);
    for (int i = 0; i < NUM_PLANES; i++) {
        float facing = dot(rd, planeNormals[i]);
        float gap = planeDists[i] * planeScale - dot(ro, planeNormals[i]);
        if (abs(facing) < 1e-5) {
            if (gap < 0.0) return false;
            continue;
        }
        float t = gap / facing;
        if (facing < 0.0) {
            if (t > tEnter) {
                tSecond = tEnter;
                tEnter = t;
                normal = planeNormals[i];
            } else if (t > tSecond) {
                tSecond = t;
            }
        } else {
            tExit = min(tExit, t);
        }
    }
    if (sphereRadius > 0.0) {
        float along = dot(ro, rd);
        float under = along * along - dot(ro, ro) + sphereRadius * sphereRadius;
        if (under < 0.0) return false;
        float root = sqrt(under);
        if (-along - root > tEnter) {
            tSecond = tEnter;
            tEnter = -along - root;
            normal = (ro + rd * tEnter) / sphereRadius;
        }
        tExit = min(tExit, -along + root);
    }
    edgeDist = tEnter - tSecond;
    return tEnter < tExit && tExit > 0.0;
}

vec3 traceInside(vec3 pos, vec3 dir, float ior) {
    for (int bounce = 0; bounce < MAX_BOUNCES; bounce++) {
        float nearest = FAR;
        vec3 exitNormal = vec3(0.0, 1.0, 0.0);
        for (int i = 0; i < NUM_PLANES; i++) {
            float facing = dot(dir, planeNormals[i]);
            if (facing > 1e-5) {
                float t = (planeDists[i] * planeScale - dot(pos, planeNormals[i])) / facing;
                if (t < nearest) {
                    nearest = t;
                    exitNormal = planeNormals[i];
                }
            }
        }
        if (sphereRadius > 0.0) {
            float along = dot(pos, dir);
            float t = -along + sqrt(max(along * along - dot(pos, pos) + sphereRadius * sphereRadius, 0.0));
            if (t < nearest) {
                nearest = t;
                exitNormal = normalize(pos + dir * t);
            }
        }
        pos += dir * nearest;
        vec3 outside = refract(dir, -exitNormal, ior);
        if (dot(outside, outside) > 0.0) {
            return outside;
        }
        dir = reflect(dir, exitNormal);
    }
    return dir;
}

float sampleChannel(vec2 uv, vec3 pos, vec3 rd, vec3 normal, mat3 toView, float ior, float aspect, int channel) {
    vec3 inside = refract(rd, normal, 1.0 / ior);
    vec3 outDir = toView * traceInside(pos, inside, ior);
    float strength = uRefraction * (1.0 + 4.0 * breathe);
    vec2 shifted = uv + outDir.xy * strength * vec2(1.0 / aspect, 1.0);
    vec4 c = texture(uPicture, shifted);
    return channel == 0 ? c.r : (channel == 1 ? c.g : c.b);
}

vec4 shadeGem(vec2 uv, vec3 ro, vec3 rd, mat3 toView, float aspect, out float hitDist) {
    float tEnter, tExit, edgeDist;
    vec3 normal;
    hitDist = FAR;
    if (!hitGem(ro, rd, tEnter, tExit, normal, edgeDist)) {
        return vec4(0.0);
    }
    hitDist = tEnter;
    vec3 pos = ro + rd * tEnter;

    float spread = uDispersion * (1.0 + 2.0 * uSparkle);
    vec3 color = vec3(
        sampleChannel(uv, pos, rd, normal, toView, uIor - spread, aspect, 0),
        sampleChannel(uv, pos, rd, normal, toView, uIor, aspect, 1),
        sampleChannel(uv, pos, rd, normal, toView, uIor + spread, aspect, 2));

    vec3 viewNormal = toView * normal;
    vec3 lightDir = normalize(vec3(0.35, 0.6, -0.7));
    color *= uFacetBase + uFacetContrast * max(dot(viewNormal, lightDir), 0.0);

    float fresnel = pow(1.0 - max(dot(-rd, normal), 0.0), 3.0);
    color += vec3(0.35) * fresnel;

    float edgeGlint = 1.0 - smoothstep(0.0, 0.016, edgeDist);
    float facetGlint = pow(max(dot(viewNormal, normalize(lightDir + vec3(0.0, 0.0, -1.0))), 0.0), 30.0);
    color += vec3(0.9, 0.95, 1.0) * (edgeGlint * uGemEdge * (1.0 + uGlintGain * uSparkle) + facetGlint * (0.2 + uGlintGain * uSparkle));

    float margin = tExit - tEnter;
    float cover = smoothstep(0.0, max(fwidth(margin), 1e-4) * 1.5, margin);
    return vec4(color * cover, cover);
}

// ---- The disco ball (crystal_refract.glsl) ----

float tileHash(vec2 id) {
    return fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 imageAt(vec2 uv) {
    return texture(uPicture, 1.0 - abs(1.0 - mod(uv, 2.0))).rgb;
}

float lumps(vec3 n) {
    return sin(n.x * 6.0) * sin(n.y * 6.0 + 1.0) * sin(n.z * 6.0 + 2.0);
}

vec3 lumpLean(vec3 n) {
    const vec2 e = vec2(0.05, 0.0);
    return vec3(lumps(n + e.xyy) - lumps(n - e.xyy), lumps(n + e.yxy) - lumps(n - e.yxy),
                lumps(n + e.yyx) - lumps(n - e.yyx)) / (2.0 * e.x);
}

vec4 shadeDisco(vec2 uv, vec3 ro, vec3 rd, mat3 toView, float aspect, out float hitDist) {
    float radius = uSize * uScale * mix(uDiscoSize, uSphereSize, uToSphere) * (1.0 + breathe);
    hitDist = FAR;

    float along = dot(ro, rd);
    float nearest = sqrt(max(dot(ro, ro) - along * along, 0.0));
    float bubble = sin(PI * uToSphere) * uDiscoBubble;
    float cover;
    float t;
    if (bubble > 0.0) {
        float reach = radius * (1.0 + bubble);
        if (nearest >= reach) return vec4(0.0);
        float root = sqrt(reach * reach - nearest * nearest);
        t = -along - root;
        float tEnd = -along + root;
        float closest = 1e9;
        float closestT = t;
        cover = 0.0;
        for (int i = 0; i < 20; i++) {
            if (t >= tEnd) break;
            vec3 at = ro + rd * t;
            float fromMiddle = length(at);
            float d = fromMiddle - radius * (1.0 + bubble * lumps(at / fromMiddle));
            if (d < 0.001) {
                cover = 1.0;
                closestT = t;
                break;
            }
            if (d < closest) {
                closest = d;
                closestT = t;
            }
            t += d * 0.6;
        }
        t = closestT;
        if (cover == 0.0) cover = 1.0 - closest * uLens * uRes.y / t;
        if (cover <= 0.0) return vec4(0.0);
    } else {
        cover = clamp((radius - nearest) / max(fwidth(nearest), 1e-4) + 0.5, 0.0, 1.0);
        if (cover <= 0.0) return vec4(0.0);
        t = -along - sqrt(max(radius * radius - nearest * nearest, 0.0));
    }
    hitDist = t;
    vec3 round_ = normalize(ro + rd * t);
    vec3 lean = bubble > 0.0 ? lumpLean(round_) * bubble : vec3(0.0);

    float up = (asin(clamp(round_.y, -1.0, 1.0)) + PI * 0.5) / PI * uDiscoRows;
    float row = floor(up);
    float latitude = (row + 0.5) / uDiscoRows * PI - PI * 0.5;
    float inRow = max(floor(2.0 * uDiscoRows * cos(latitude)), 1.0);
    float around = (atan(round_.z, round_.x) + PI) / (2.0 * PI) * inRow;
    float column = floor(around);
    vec2 id = vec2(row, column);

    float longitude = (column + 0.5) / inRow * 2.0 * PI - PI;
    vec3 facing = vec3(cos(latitude) * cos(longitude), sin(latitude), cos(latitude) * sin(longitude));
    vec3 uneven = vec3(tileHash(id), tileHash(id + 3.7), tileHash(id + 7.1)) - 0.5;
    vec3 normal = normalize(facing + uneven * uDiscoScatter - lean);

    vec3 bounced = toView * reflect(rd, normal);
    vec2 offset = bounced.xy * uRefraction * vec2(1.0 / aspect, 1.0);
    float spread = uDispersion * (1.0 + 2.0 * uSparkle);
    vec3 color = vec3(imageAt(uv + offset * (1.0 - spread)).r,
                      imageAt(uv + offset).g,
                      imageAt(uv + offset * (1.0 + spread)).b);

    vec3 lightDir = normalize(vec3(0.35, 0.6, -0.7));
    vec3 viewNormal = toView * normal;
    color = (color + vec3(0.12)) * (uFacetBase + uFacetContrast * max(dot(toView * round_, lightDir), 0.0));
    color *= 0.8 + 0.5 * tileHash(id + 11.3);

    float flash = pow(max(dot(viewNormal, normalize(lightDir + vec3(0.0, 0.0, -1.0))), 0.0), 60.0);
    float twinkle = step(0.93, tileHash(id + floor(uAngle * 10.0)));
    color += vec3(0.95, 0.97, 1.0) * (flash * uGlintGain + twinkle * uSparkle * uDiscoTwinkle);

    vec2 inTile = vec2(fract(up), fract(around));
    float toEdge = min(min(inTile.x, 1.0 - inTile.x), min(inTile.y, 1.0 - inTile.y));
    color *= mix(0.12, 1.0, smoothstep(0.0, uDiscoGrout, toEdge));

    float wait = tileHash(id + 5.5) * 0.6;
    float melted = smoothstep(wait, wait + 0.4, uToSphere);
    if (melted > 0.0) {
        vec3 smooth_ = normalize(round_ - lean);
        vec3 bent = toView * refract(rd, smooth_, 1.0 / uIor);
        vec3 clear = imageAt(uv + bent.xy * uRefraction * vec2(1.0 / aspect, 1.0))
            * (uFacetBase + uFacetContrast * max(dot(toView * smooth_, lightDir), 0.0));
        color = mix(color, clear, melted);
    }

    float fresnel = pow(1.0 - max(dot(-rd, round_), 0.0), 3.0);
    color += vec3(0.2) * fresnel;
    return vec4(color * cover, cover);
}

vec4 drawGem(vec2 uv, float aspect, vec3 from, mat3 toGem, mat3 toView, out float gemDist) {
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) - vec2(uOffsetX, uOffsetY);
    vec3 rd = toGem * normalize(vec3(p, uLens));
    vec4 result;
    if (int(uShapeA + 0.5) == SHAPE_DISCO) {
        result = shadeDisco(uv, from, rd, toView, aspect, gemDist);
        if (uToSphere > 0.0) {
            sphereRadius = uSize * uScale * uSphereSize;
            float sphereDist;
            result = mix(result, shadeGem(uv, from, rd, toView, aspect, sphereDist), smoothstep(0.85, 1.0, uToSphere));
            gemDist = min(gemDist, sphereDist);
        }
    } else {
        if (uToSphere > 0.0) {
            sphereRadius = uSize * uScale * mix(1.2, uSphereSize, uToSphere);
        }
        result = shadeGem(uv, from, rd, toView, aspect, gemDist);
    }
    return result;
}

void main() {
    buildGem(uBreathe);
    float aspect = uRes.x / uRes.y;
    mat3 toGem = rotateY(-uAngle) * rotateX(uTilt) * rotateZ(uRoll);
    vec3 from = toGem * vec3(0.0, 0.0, -uCameraDistance);
    mat3 toView = transpose(toGem);

    int samples = clamp(int(uSamples + 0.5), 1, 4);
    vec4 result = vec4(0.0);
    for (int s = 0; s < 4; s++) {
        if (s >= samples) break;
        float sampleDist;
        result += drawGem(sampleUV(s, samples), aspect, from, toGem, toView, sampleDist);
    }
    fragColor = result / float(samples);
}`;

// crystal_shatter.glsl.
const SHATTER = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uGem;
uniform sampler2D uPicture;
uniform vec2 uRes;

uniform float uExplode;
uniform float uGemShrink;
uniform float uShardSpread;
uniform float uShardSize;
uniform float uShardGrow;
uniform float uShardSpin;
uniform float uShardTurn;
uniform float uShardSpinMax;
uniform float uShardPulse;
uniform float uShardPulseSize;
uniform float uBackgroundDim;
uniform float uShadow;
uniform float uWhiteKnee;
uniform float uWhiteMax;

const float GEM_REACH = 0.62;
const float GEM_RADIUS = 0.42;
const int HALO_TAPS = 12;
const float HALO_RADIUS = 0.035;

float aspect;

vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

vec2 toUV(vec2 p) {
    return p / vec2(aspect, 1.0) + 0.5;
}

vec2 seedOf(vec2 cell) {
    return (cell + 0.2 + 0.6 * hash2(cell)) * uShardSize;
}

vec2 nearestCell(vec2 q, out float edgeGap) {
    vec2 base = floor(q / uShardSize);
    vec2 best = base;
    float first = 1e9, second = 1e9;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 cell = base + vec2(float(x), float(y));
            float d = length(q - seedOf(cell));
            if (d < first) {
                second = first;
                first = d;
                best = cell;
            } else if (d < second) {
                second = d;
            }
        }
    }
    edgeGap = second - first;
    return best;
}

vec4 shatteredGem(vec2 screen) {
    vec2 cut = screen / mix(uGemShrink, 1.0, uExplode);
    float cloudC = cos(uShardTurn), cloudS = sin(uShardTurn);
    vec2 p = vec2(cloudC * cut.x + cloudS * cut.y, cloudC * cut.y - cloudS * cut.x);
    float pulse = uShardPulse * uExplode;

    int reach = int(ceil(GEM_REACH / uGemShrink / uShardSize));
    for (int j = -8; j <= 8; j++) {
        if (j < -reach || j > reach) continue;
        for (int i = -8; i <= 8; i++) {
            if (i < -reach || i > reach) continue;
            vec2 cell = vec2(float(i), float(j));
            vec2 seed = seedOf(cell);
            vec2 random = hash2(cell + 17.0);

            float fill = length(vec2(aspect * 0.5, 0.5)) / GEM_RADIUS * uShardSpread;
            vec2 away = (seed * fill * (0.75 + 0.5 * random.x) - seed) * uExplode;
            float scale = (1.0 + (uShardGrow - 1.0) * uExplode)
                * (1.0 + uShardPulseSize * pulse * (0.6 + 0.8 * random.y));
            vec2 local = (p - seed - away) / scale;
            if (dot(local, local) > uShardSize * uShardSize * 3.0) {
                continue;
            }
            float turns = (1.0 + floor(fract(random.x * 37.0) * uShardSpinMax))
                * (fract(random.y * 53.0) > 0.5 ? 1.0 : -1.0);
            float spin = (random.y - 0.5) * 6.28318 * uShardSpin * uExplode + turns * uShardTurn;
            float c = cos(-spin), s = sin(-spin);
            vec2 q = vec2(c * local.x - s * local.y, s * local.x + c * local.y) + seed;

            float edgeGap;
            if (nearestCell(q, edgeGap) != cell) {
                continue;
            }
            vec4 color = texture(uGem, toUV(seed * uGemShrink + (q - seed) * mix(uGemShrink, uShardGrow, uExplode)));
            if (color.a < 0.02) {
                continue;
            }
            float glow = (1.0 - smoothstep(0.0, 0.012, edgeGap)) * uExplode;
            color.rgb += vec3(0.9, 0.95, 1.0) * glow * color.a;
            float pixel = 1.0 / (uRes.y * mix(uGemShrink, 1.0, uExplode) * scale);
            return color * mix(1.0, smoothstep(0.0, pixel * 3.0, edgeGap), smoothstep(0.0, 0.1, uExplode));
        }
    }
    return vec4(0.0);
}

vec4 gemAt(vec2 p, out float halo) {
    vec2 uv = toUV(p);
    vec4 gem = uExplode > 0.001 ? shatteredGem(p) : texture(uGem, uv);
    halo = 0.0;
    for (int i = 0; i < HALO_TAPS; i++) {
        float a = 6.28318 * float(i) / float(HALO_TAPS);
        halo += texture(uGem, uv + vec2(cos(a) / aspect, sin(a)) * HALO_RADIUS).a;
    }
    halo *= (1.0 - uExplode) / float(HALO_TAPS);
    return gem;
}

void main() {
    aspect = uRes.x / uRes.y;
    vec2 uv = vUV;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float halo;
    vec4 gem = gemAt(p, halo);

    if (gem.a > 0.001 && uWhiteMax > uWhiteKnee) {
        vec3 c = gem.rgb / gem.a;
        float peak = max(max(c.r, c.g), c.b);
        if (peak > uWhiteKnee) {
            float room = uWhiteMax - uWhiteKnee;
            float rolled = uWhiteKnee + room * (1.0 - exp(-(peak - uWhiteKnee) / room));
            gem.rgb = c * (rolled / peak) * gem.a;
        }
    }

    vec3 background = texture(uPicture, uv).rgb * uBackgroundDim * (1.0 - uShadow * halo);
    // The alpha marks the crystal, which the scenes use to keep it whole (crystal_out).
    fragColor = vec4(gem.rgb + background * (1.0 - gem.a), gem.a);
}`;

// A plain copy, for showing the visitor's own picture.
const COPY = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uPicture;
uniform vec2 uRes;
uniform vec2 uImageSize;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uRecolor;   // 0 is the picture's colors, 1 is the palette's (photo_fx.glsl)
vec3 palette(float x) {
    x = clamp(x, 0.0, 1.0) * 3.0;
    if (x < 1.0) return mix(uColor0, uColor1, x);
    if (x < 2.0) return mix(uColor1, uColor2, x - 1.0);
    return mix(uColor2, uColor3, x - 2.0);
}
void main() {
    // Cover the canvas, keeping the picture's shape.
    float canvas = uRes.x / uRes.y;
    float image = uImageSize.x / uImageSize.y;
    vec2 uv = vUV - 0.5;
    if (image > canvas) uv.x *= canvas / image; else uv.y *= image / canvas;
    vec3 color = texture(uPicture, uv + 0.5).rgb;
    color = mix(color, palette(dot(color, vec3(0.3, 0.6, 0.1))), uRecolor);
    fragColor = vec4(color, 1.0);
}`;

// photo_fx.glsl: what the music does to the picture before the crystal sees it. Only the
// plumbing changed: the picture is a sampler covering the canvas (cropped to keep its shape, as
// COPY does), and mirrored past its edges in the canvas's space.
const PHOTO = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uPicture;
uniform vec2 uRes;
uniform vec2 uImageSize;
uniform float uBass, uTreble, uPulse, uBurst, uFlow, uRecolor;
uniform float uRingAge, uRingPower, uRing, uRingSpeed, uRingWidth, uRingFade;
uniform float uWarp, uWaveBlend, uWaveSize, uWaveSpeed, uCopyZoom;
uniform float uRipple, uRippleScale, uDispersion, uZoom, uGlitch, uSlices;
uniform float uStyleA, uStyleB, uStyleMix;
uniform vec3 uColor0, uColor1, uColor2, uColor3;

float hash(float x) { return fract(sin(x * 127.1) * 43758.5453); }
vec3 palette(float x) {
    x = clamp(x, 0.0, 1.0) * 3.0;
    if (x < 1.0) return mix(uColor0, uColor1, x);
    if (x < 2.0) return mix(uColor1, uColor2, x - 1.0);
    return mix(uColor2, uColor3, x - 2.0);
}
vec2 mirrored(vec2 uv) { return 1.0 - abs(1.0 - mod(uv, 2.0)); }
// A point on the canvas (0 to 1) to the picture, which covers the canvas keeping its shape.
vec3 picture(vec2 uv) {
    float canvas = uRes.x / uRes.y, image = uImageSize.x / uImageSize.y;
    vec2 p = mirrored(uv) - 0.5;
    if (image > canvas) p.x *= canvas / image; else p.y *= image / canvas;
    return texture(uPicture, p + 0.5).rgb;
}
vec2 liquid(vec2 p, float time) {
    float turn = time * 0.11;
    float c = cos(turn), s = sin(turn);
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) * (1.0 + 0.35 * sin(time * 0.23));
    vec2 q = p * uRippleScale * 6.28318;
    return vec2(sin(q.y + time * 6.28318) + 0.5 * sin(q.y * 1.7 + q.x * 0.6 - time * 9.0),
                sin(q.x * 0.9 - time * 6.28318) + 0.5 * sin(q.x * 1.6 - q.y * 0.7 + time * 7.0));
}
float noise(vec2 x) {
    vec2 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i.x + i.y * 57.0), b = hash(i.x + 1.0 + i.y * 57.0);
    float c = hash(i.x + (i.y + 1.0) * 57.0), d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float waves(int style, vec2 p, float time) {
    float size = uWaveSize * 6.28318;
    if (style == 1) {
        vec2 centre = 0.35 * vec2(sin(time * 0.31), cos(time * 0.23));
        return sin(length(p - centre) * size * 1.4 - time * 6.28318);
    }
    if (style == 2) return sin(atan(p.y, p.x) * 3.0 + length(p) * size * 1.2 - time * 6.28318);
    if (style == 3) {
        vec2 q = p * uWaveSize * 2.5;
        float n = noise(q + vec2(time * 0.4, 0.0)) * 0.65 + noise(q * 2.1 - vec2(0.0, time * 0.5)) * 0.35;
        return sin(n * 12.566 + time * 1.5);
    }
    float heading = time * 0.15;
    vec2 along = vec2(cos(heading), sin(heading));
    vec2 across = vec2(-along.y, along.x);
    return sin(dot(p, along) * size + time * 6.28318 + 1.6 * sin(dot(p, across) * uWaveSize * 3.0 + time * 2.7));
}
void main() {
    float aspect = uRes.x / uRes.y;
    vec2 toUV = vec2(1.0 / aspect, 1.0);
    vec2 uv = 0.5 + (vUV - 0.5) * (1.0 - uZoom * uPulse);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float time = uFlow * uWaveSpeed;
    uv += liquid(p, uFlow) * (uWarp + uRipple * uBass) * toUV;
    float fromMiddle = max(length(p), 0.001);
    float atRing = (fromMiddle - uRingAge * uRingSpeed) / uRingWidth;
    uv += p / fromMiddle * exp(-atRing * atRing) * uRing * uRingPower * exp(-uRingAge * uRingFade) * toUV;
    float slice = floor(vUV.y * uSlices);
    uv.x += (hash(slice) - 0.5) * step(0.55, hash(slice + 9.0)) * uGlitch * uBurst;
    vec2 split = (uv - 0.5) * (uDispersion * uTreble * 4.0 + uGlitch * uBurst * 0.4);
    vec3 color = vec3(picture(uv + split).r, picture(uv).g, picture(uv - split).b);
    float turn = time * 0.25;
    float c = cos(turn), s = sin(turn);
    vec2 q = vec2(-(c * p.x - s * p.y), s * p.x + c * p.y) / uCopyZoom;
    q += liquid(p + 0.37, -uFlow * 1.3) * uWarp;
    vec3 copy = picture(q * toUV + 0.5);
    float a = waves(int(uStyleA + 0.5), p, time);
    float b = uStyleMix > 0.001 ? waves(int(uStyleB + 0.5), p, time) : a;
    color = mix(color, copy, smoothstep(-0.4, 0.4, mix(a, b, uStyleMix)) * uWaveBlend);
    color = mix(color, palette(dot(color, vec3(0.3, 0.6, 0.1))), uRecolor);
    fragColor = vec4(color, 1.0);
}`;

// crystal_structure.glsl, for the eyeball and a cast model: a surface described by distance,
// marched into like the figures. The model's distance grid comes as two textures, uModelDist
// (half floats, the signed distance in model units) and uModelNormal (which way the surface
// faces, folded into two channels), made from the project's atlas by web/demo/tools.
const STRUCTURE = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uPicture;
uniform sampler2D uModelDist;
uniform sampler2D uModelNormal;
uniform vec2 uRes;

uniform float uAngle;
uniform float uFacetBase;
uniform float uFacetContrast;
uniform float uEdgeGlow;
uniform float uGlintGain;
uniform float uSize;
uniform float uIor;
uniform float uRefraction;
uniform float uDispersion;
uniform float uBreathe;
uniform float uSparkle;
uniform float uShapeA;
uniform float uScale;
uniform float uOffsetX;
uniform float uOffsetY;
uniform float uCameraDistance;
uniform float uLens;
uniform float uSamples;
uniform float uToSphere;
uniform float uSphereSize;
uniform float uEyeIris;
uniform float uEyePupil;
uniform float uEyeX;
uniform float uEyeY;
uniform float uEyeBlink;
uniform float uStructureSize;
uniform float uStructureLean;
uniform float uStructureEdge;
uniform float uModelGrid;
uniform float uModelSpan;
uniform float uModelTilt;

const float PI = 3.14159265;
const float FAR = 1e5;
const vec2 SAMPLE_OFFSETS[4] = vec2[](vec2(-0.375, -0.125), vec2(0.125, -0.375),
                                      vec2(0.375, 0.125), vec2(-0.125, 0.375));
const int SHAPE_EYE = 10;
const int SHAPE_MODEL = 11;
const float EYE_RADIUS = 0.85;
const float REACH = 1.05;
const int MARCH_STEPS = 48;
const int INSIDE_STEPS = 10;

vec2 sampleUV(int which, int samples) {
    return vUV + (samples > 1 ? SAMPLE_OFFSETS[which] : vec2(0.0)) / uRes;
}

mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1.0, 0.0, 0.0,  0.0, c, s,  0.0, -s, c);
}

mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0.0, -s,  0.0, 1.0, 0.0,  s, 0.0, c);
}

mat3 rotateZ(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, s, 0.0,  -s, c, 0.0,  0.0, 0.0, 1.0);
}

// The grid read at a point: the two slices around it blended, each read with the texture's
// own blending between cells. Returns the distance and the folded normal.
vec3 modelCell(vec3 p) {
    float n = uModelGrid;
    float tiles = ceil(sqrt(n));
    vec3 g = clamp((p / uModelSpan * 0.5 + 0.5) * (n - 1.0), 0.0, n - 1.0);
    float z0 = floor(g.z);
    float z1 = min(z0 + 1.0, n - 1.0);
    vec2 atlas = vec2(textureSize(uModelDist, 0));
    vec2 uv0 = vec2(mod(z0, tiles) * n + g.x + 0.5, atlas.y - floor(z0 / tiles) * n - g.y - 0.5) / atlas;
    vec2 uv1 = vec2(mod(z1, tiles) * n + g.x + 0.5, atlas.y - floor(z1 / tiles) * n - g.y - 0.5) / atlas;
    float t = g.z - z0;
    float d = mix(texture(uModelDist, uv0).r, texture(uModelDist, uv1).r, t);
    vec2 folded = mix(texture(uModelNormal, uv0).rg, texture(uModelNormal, uv1).rg, t);
    return vec3(d, folded);
}

float modelDistance(vec3 p) {
    return modelCell(p).x + length(max(abs(p) - uModelSpan, 0.0));
}

float shapeDistance(vec3 p) {
    int shape = int(uShapeA + 0.5);
    if (shape == SHAPE_EYE) return length(p) - EYE_RADIUS;
    return modelDistance(p);
}

float structure(vec3 p) {
    if (uToSphere <= 0.0) return shapeDistance(p);
    return mix(shapeDistance(p), length(p) - uSphereSize / uStructureSize, uToSphere);
}

float eyeCuts(vec3 pos, mat3 toView, inout vec3 normal, out float shine) {
    vec3 n = normalize(pos);
    float fromFront = acos(clamp(-n.z, -1.0, 1.0));
    float around = atan(n.y, n.x);
    vec3 cut = normal;
    float bright = 1.0;
    float pupil = uEyePupil;
    if (fromFront < uEyeIris) {
        float fibers = 0.5 + 0.3 * sin(around * 57.0) * sin(around * 23.0 + 1.3) + 0.2 * sin(around * 131.0);
        bright = mix(0.7, 1.1, fibers) * mix(1.1, 0.75, smoothstep(pupil, uEyeIris, fromFront));
        bright *= mix(0.25, 1.0, smoothstep(0.0, 0.1, uEyeIris - fromFront));
        bright *= smoothstep(pupil - 0.012, pupil + 0.012, fromFront) * 0.98 + 0.02;
    } else {
        bright = 0.9;
    }
    shine = 0.0;
    float blink = uEyeBlink * (1.0 - uToSphere);
    if (blink > 0.001) {
        const float CLOSED_AT = -0.12;
        const float OPEN_AT = 1.7;
        vec3 seen = toView * n;
        float across = asin(clamp(seen.x, -1.0, 1.0));
        float up = atan(seen.y, -seen.z);
        float pastLid = max(up - mix(OPEN_AT, CLOSED_AT, blink), mix(-OPEN_AT, CLOSED_AT, blink) - up);
        if (pastLid > 0.0) {
            bright = 0.8;
            shine = 0.0;
        }
        bright *= mix(0.2, 1.0, smoothstep(0.0, 0.07, abs(pastLid)));
    }
    normal = normalize(mix(cut, normal, uToSphere));
    return mix(bright, 1.0, uToSphere);
}

vec3 structureNormal(vec3 p) {
    if (int(uShapeA + 0.5) == SHAPE_MODEL) {
        vec2 folded = modelCell(p).yz * 2.0 - 1.0;
        vec3 facing = vec3(folded, 1.0 - abs(folded.x) - abs(folded.y));
        float unfold = max(-facing.z, 0.0);
        facing.x += facing.x >= 0.0 ? -unfold : unfold;
        facing.y += facing.y >= 0.0 ? -unfold : unfold;
        return normalize(mix(normalize(facing), normalize(p), uToSphere));
    }
    const vec2 e = vec2(0.002, -0.002);
    return normalize(e.xyy * structure(p + e.xyy) + e.yyx * structure(p + e.yyx)
                   + e.yxy * structure(p + e.yxy) + e.xxx * structure(p + e.xxx));
}

vec3 structureExit(vec3 pos, vec3 dir) {
    float t = 0.02;
    for (int i = 0; i < INSIDE_STEPS; i++) {
        float d = -structure(pos + dir * t);
        if (d < 0.003) break;
        t += d;
    }
    vec3 exitNormal = structureNormal(pos + dir * t);
    vec3 outside = refract(dir, -exitNormal, uIor);
    return dot(outside, outside) > 0.0 ? outside : reflect(dir, exitNormal);
}

vec4 shadeStructure(vec2 uv, vec3 ro, vec3 rd, mat3 toView, float aspect, float pixelSize) {
    float unit = uSize * uScale * uStructureSize * (1.0 + uBreathe);
    vec3 start = ro / unit;
    float along = dot(start, rd);
    float under = along * along - dot(start, start) + REACH * REACH;
    if (under < 0.0) return vec4(0.0);
    float root = sqrt(under);
    float t = max(-along - root, 0.0);
    float tEnd = -along + root;
    float cover = 0.0;
    float nearestRatio = 1.0;
    float nearestT = t;
    for (int i = 0; i < MARCH_STEPS; i++) {
        if (t >= tEnd) break;
        float d = structure(start + rd * t);
        if (d < 0.002) {
            cover = 1.0;
            nearestT = t;
            break;
        }
        float ratio = d / (pixelSize * t);
        if (ratio < nearestRatio) {
            nearestRatio = ratio;
            nearestT = t;
        }
        t += d * 0.9;
    }
    if (cover == 0.0) cover = 1.0 - nearestRatio;
    if (cover <= 0.0) return vec4(0.0);
    t = nearestT;
    vec3 pos = start + rd * t;
    vec3 normal = structureNormal(pos);
    float shine = 0.0;
    float bright = int(uShapeA + 0.5) == SHAPE_EYE ? eyeCuts(pos, toView, normal, shine) : 1.0;
    vec3 exitDir = structureExit(pos, refract(rd, normal, 1.0 / uIor));
    vec3 outDir = toView * exitDir;
    vec2 shifted = outDir.xy * uRefraction * (1.0 + 4.0 * uBreathe) * vec2(1.0 / aspect, 1.0);
    float spread = uDispersion * (1.0 + 2.0 * uSparkle) * 6.0;
    vec3 color = vec3(texture(uPicture, uv + shifted * (1.0 - spread)).r,
                      texture(uPicture, uv + shifted).g,
                      texture(uPicture, uv + shifted * (1.0 + spread)).b);
    vec3 viewNormal = toView * normal;
    vec3 lightDir = normalize(vec3(0.35, 0.6, -0.7));
    color *= uFacetBase + uFacetContrast * max(dot(viewNormal, lightDir), 0.0);
    color *= bright;
    color += vec3(0.35) * min(bright, 1.0) * pow(1.0 - max(dot(-rd, normal), 0.0), 3.0);
    float edge = smoothstep(0.3, 0.9, length(fwidth(normal)));
    float glint = pow(max(dot(viewNormal, normalize(lightDir + vec3(0.0, 0.0, -1.0))), 0.0), 30.0);
    float edgeGlow = uStructureEdge * (1.0 + uGlintGain * uSparkle);
    color += vec3(0.9) * shine;
    color += vec3(0.9, 0.95, 1.0) * min(bright, 1.0) * (edge * edgeGlow + glint * (0.2 + uGlintGain * uSparkle));
    return vec4(color * cover, cover);
}

void main() {
    float aspect = uRes.x / uRes.y;
    vec3 cameraPos = vec3(0.0, 0.0, -uCameraDistance);
    const mat3 DIAGONAL_FORWARD = mat3(0.70711, 0.0, -0.70711,
                                       -0.40825, 0.8165, -0.40825,
                                       0.57735, 0.57735, 0.57735);
    mat3 turned = rotateZ(-uAngle) * rotateX(uStructureLean * sin(uAngle)) * rotateY(uStructureLean * cos(uAngle));
    int shape = int(uShapeA + 0.5);
    mat3 toStructure = DIAGONAL_FORWARD * turned;
    if (shape == SHAPE_EYE) toStructure = rotateX(-uEyeY) * rotateY(uEyeX);
    if (shape == SHAPE_MODEL) toStructure = rotateY(uAngle) * rotateX(uModelTilt);
    int samples = clamp(int(uSamples + 0.5), 1, 4);
    vec4 result = vec4(0.0);
    for (int s = 0; s < 4; s++) {
        if (s >= samples) break;
        vec2 uv = sampleUV(s, samples);
        vec2 p = (uv - 0.5) * vec2(aspect, 1.0) - vec2(uOffsetX, uOffsetY);
        vec3 cameraRay = normalize(vec3(p, uLens));
        result += shadeStructure(uv, toStructure * cameraPos, toStructure * cameraRay, transpose(toStructure),
                                 aspect, 1.0 / (uLens * uRes.y));
    }
    fragColor = result / float(samples);
}`;

window.QRTZ_SHADERS = { VERTEX, PICTURE, GEM, SHATTER, COPY, PHOTO, STRUCTURE };
