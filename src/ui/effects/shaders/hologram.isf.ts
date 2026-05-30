/**
 * Godot-style holographic specular + foil-like idle sweep.
 * `intensity` scales all shimmer; `ambient` scales the TIME/UV layer (visible at rest).
 */
export const HOLOGRAM_ISF = String.raw`/*{
    "DESCRIPTION": "Holographic iridescent specular from normal-map lighting",
    "ISFVSN": "2",
    "CATEGORIES": ["Stylize", "Filter"],
    "INPUTS": [
        {
            "NAME": "inputImage",
            "TYPE": "image"
        },
        {
            "NAME": "lightOffset",
            "TYPE": "point2D",
            "DEFAULT": [0.0, 0.0]
        },
        {
            "NAME": "viewOffset",
            "TYPE": "point2D",
            "DEFAULT": [0.0, 0.0]
        },
        {
            "NAME": "normalDepth",
            "TYPE": "float",
            "DEFAULT": 0.25,
            "MIN": 0.0,
            "MAX": 1.0
        },
        {
            "NAME": "colorCompression",
            "TYPE": "float",
            "DEFAULT": 6.0,
            "MIN": 1.0,
            "MAX": 12.0
        },
        {
            "NAME": "intensity",
            "TYPE": "float",
            "DEFAULT": 1.0,
            "MIN": 0.0,
            "MAX": 2.0
        },
        {
            "NAME": "emission",
            "TYPE": "float",
            "DEFAULT": 0.125,
            "MIN": 0.0,
            "MAX": 0.5
        },
        {
            "NAME": "ambient",
            "TYPE": "float",
            "DEFAULT": 0.4,
            "MIN": 0.0,
            "MAX": 1.0
        },
        {
            "NAME": "lineRotation",
            "TYPE": "float",
            "DEFAULT": 0.0,
            "MIN": 0.0,
            "MAX": 6.28318
        }
    ]
}*/

vec3 hsv2rgb(vec3 hsv) {
    float h = hsv.x * colorCompression;
    float s = hsv.y;
    float v = hsv.z;

    float c = v * s;
    float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
    vec3 rgb = vec3(0.0);

    if (0.0 <= h && h < 1.0) rgb = vec3(c, x, 0.0);
    else if (1.0 <= h && h < 2.0) rgb = vec3(x, c, 0.0);
    else if (2.0 <= h && h < 3.0) rgb = vec3(0.0, c, x);
    else if (3.0 <= h && h < 4.0) rgb = vec3(0.0, x, c);
    else if (4.0 <= h && h < 5.0) rgb = vec3(x, 0.0, c);
    else if (5.0 <= h && h < 6.0) rgb = vec3(c, 0.0, x);

    return rgb + (v - c);
}

float range_lerp(float value, float istart, float istop, float ostart, float ostop) {
    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}

vec3 sampleNormalMap(vec2 uv) {
    vec2 nUv = uv * 2.0;
    float t = TIME * 0.2;
    return vec3(
        0.5 + 0.5 * sin(nUv.x * 6.28318 + t),
        0.5 + 0.5 * cos(nUv.y * 6.28318 - t * 0.7),
        1.0
    );
}

vec3 normalFromArt(vec2 uv, vec4 center) {
    vec2 px = 1.0 / max(RENDERSIZE, vec2(1.0));
    float lum = dot(center.rgb, vec3(0.299, 0.587, 0.114));
    float lx = dot(IMG_NORM_PIXEL(inputImage, clamp(uv + vec2(px.x, 0.0), 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));
    float ly = dot(IMG_NORM_PIXEL(inputImage, clamp(uv + vec2(0.0, px.y), 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));
    return normalize(vec3((lx - lum) * 5.0, (ly - lum) * 5.0, 1.0));
}

void main() {
    vec2 uv = isf_FragNormCoord;
    vec4 texel = IMG_NORM_PIXEL(inputImage, uv);

    float low = min(texel.r, min(texel.g, texel.b));
    float high = max(texel.r, max(texel.g, texel.b));
    float delta = min(high, max(0.5, 1.0 - low));
    float cover = mix(0.32, delta, 0.78);

    vec2 radialUv = vec2(
        uv.x - 0.5,
        (uv.y - 0.5) * (RENDERSIZE.x / max(RENDERSIZE.y, 1.0))
    );

    vec3 normalMap = sampleNormalMap(uv);
    vec3 tangentNormal = normalize(vec3(
        (normalMap.r - 0.5) * 2.0 * normalDepth,
        (normalMap.g - 0.5) * 2.0 * normalDepth,
        1.0
    ));
    vec3 artNormal = normalFromArt(uv, texel);
    vec3 normal_dir = normalize(mix(tangentNormal, artNormal, 0.35));

    vec3 light_dir = normalize(vec3(lightOffset.x, lightOffset.y, 1.0));
    vec3 view_dir = normalize(vec3(viewOffset.x, viewOffset.y, 1.0));
    vec3 reflection = reflect(-view_dir, normal_dir);

    float angle = dot(reflection, light_dir);
    float specWeight = max(angle, 0.0);
    if (specWeight > 0.6) {
        specWeight = range_lerp(specWeight, 0.6, 0.65, 1.0, 0.0);
        specWeight = clamp(specWeight, 0.0, 1.0);
    }

    float sweepHue = fract(
        length(radialUv) * 2.5
        + atan(radialUv.y, radialUv.x) / 6.28318
        + lightOffset.x * 0.55
        + lightOffset.y * 0.45
        + TIME * 0.1
    );
    vec3 sweepColor = hsv2rgb(vec3(sweepHue, 0.68, 0.92));
    vec2 bandCentered = uv - vec2(0.5);
    float bandCos = cos(lineRotation);
    float bandSin = sin(lineRotation);
    vec2 bandUv = vec2(
        bandCos * bandCentered.x - bandSin * bandCentered.y,
        bandSin * bandCentered.x + bandCos * bandCentered.y
    );
    float bands = 0.5 + 0.5 * sin(bandUv.y * 110.0 - TIME * 1.35 + sweepHue * 6.28318);
    float rayFalloff = smoothstep(0.55, 0.05, length(radialUv));

    vec3 sweepShimmer = sweepColor * bands * rayFalloff * ambient * cover * intensity;

    vec3 specColor = hsv2rgb(vec3(angle * 0.5 + 0.5, 0.74, 0.9));
    vec3 specular = specColor * specWeight * cover * intensity;
    specular += specColor * specColor * specWeight * intensity * 0.22;

    vec3 shimmer = sweepShimmer + specular;
    vec3 glow = vec3(emission) * cover;

    vec3 outRgb = texel.rgb + glow + shimmer;
    vec3 maxBoost = vec3(0.38) * intensity;
    outRgb = min(outRgb, texel.rgb + maxBoost);

    float screenAmt = clamp((ambient * 0.35 + specWeight * 0.5) * intensity * cover, 0.0, 0.42);
    outRgb = mix(outRgb, 1.0 - (1.0 - outRgb) * (1.0 - sweepColor * screenAmt * 0.35), screenAmt);

    gl_FragColor = vec4(clamp(outRgb, 0.0, 1.0) * texel.a, texel.a);
}
`;
