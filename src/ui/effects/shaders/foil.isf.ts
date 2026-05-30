/** Balatro-style holographic foil shimmer on card art. */
export const FOIL_ISF = String.raw`/*{
    "DESCRIPTION": "Balatro-style holographic foil on card art",
    "ISFVSN": "2",
    "CATEGORIES": ["Stylize", "Filter"],
    "INPUTS": [
        {
            "NAME": "inputImage",
            "TYPE": "image"
        },
        {
            "NAME": "offset",
            "TYPE": "point2D",
            "DEFAULT": [0.0, 0.0]
        },
        {
            "NAME": "center",
            "TYPE": "point2D",
            "DEFAULT": [0.5, 0.5]
        },
        {
            "NAME": "speed",
            "TYPE": "float",
            "DEFAULT": 1.0,
            "MIN": 0.0,
            "MAX": 1.0
        },
        {
            "NAME": "intensity",
            "TYPE": "float",
            "DEFAULT": 0.7,
            "MIN": 0.0,
            "MAX": 1.0
        }
    ]
}*/

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = isf_FragNormCoord;
    vec4 texel = IMG_NORM_PIXEL(inputImage, uv);
    vec2 adjusted_uv = uv - center;
    vec2 radial_uv = vec2(
        adjusted_uv.x,
        adjusted_uv.y * (RENDERSIZE.x / max(RENDERSIZE.y, 1.0))
    );

    float low = min(texel.r, min(texel.g, texel.b));
    float high = max(texel.r, max(texel.g, texel.b));
    float delta = min(high, max(0.5, 1.0 - low));

    vec2 foil = vec2(TIME / max(speed, 0.05) + offset.x, offset.y);

    float fac = max(
        min(
            2.0 * sin(
                (length(90.0 * radial_uv) + foil.r * 2.0)
                + 3.0 * (1.0 + 0.8 * cos(length(113.1121 * radial_uv) - foil.r * 3.121))
            ) - 1.0 - max(5.0 - length(90.0 * radial_uv), 0.0),
            1.0
        ),
        0.0
    );

    vec2 rotater = vec2(cos(foil.r * 0.1221), sin(foil.r * 0.3512));
    float adjLen = max(length(radial_uv), 0.0001);
    float rotLen = max(length(rotater), 0.0001);
    float angle = dot(rotater, radial_uv) / (rotLen * adjLen);

    float fac2 = max(
        min(
            5.0 * cos(
                foil.g * 0.3
                + angle * 3.14159 * (2.2 + 0.9 * sin(foil.r * 1.65 + 0.2 * foil.g))
            ) - 4.0 - max(2.0 - length(20.0 * radial_uv), 0.0),
            1.0
        ),
        0.0
    );

    float fac3 = 0.3 * max(
        min(
            2.0 * sin(foil.r * 5.0 + uv.x * 3.0 + 3.0 * (1.0 + 0.5 * cos(foil.r * 7.0))) - 1.0,
            1.0
        ),
        -1.0
    );

    float fac4 = 0.3 * max(
        min(
            2.0 * sin(foil.r * 6.66 + uv.y * 3.8 + 3.0 * (1.0 + 0.5 * cos(foil.r * 3.414))) - 1.0,
            1.0
        ),
        -1.0
    );

    float peak = max(max(fac, fac2), max(fac3, fac4));
    float maxfac = clamp(max(peak + 1.1 * (fac + fac2 + fac3 + fac4), 0.0), 0.0, 1.0);

    float dist = length(radial_uv);
    float iridHue = fract(
        atan(radial_uv.y, radial_uv.x) / 6.28318
        + dist * 2.6
        + foil.r * 0.1
        + maxfac * 0.28
        + fac3 * 0.15
        + fac4 * 0.12
    );
    vec3 irid = hsv2rgb(vec3(iridHue, 0.62, 1.0));

    float bands = 0.5 + 0.5 * sin(uv.y * 130.0 - foil.r * 2.2 + angle * 3.5);
    float rayFalloff = smoothstep(0.52, 0.02, dist);
    float foilAmt = delta * maxfac * intensity;

    vec3 base = texel.rgb;

    vec3 shimmer = irid * foilAmt * 0.42;
    shimmer += vec3(0.78, 0.9, 1.0) * fac * delta * intensity * 0.2;
    shimmer += vec3(1.0, 0.98, 1.0) * fac2 * delta * intensity * 0.28 * rayFalloff;
    shimmer += vec3(1.0) * pow(maxfac, 3.5) * delta * intensity * 0.32;
    shimmer += vec3(0.18, 0.28, 0.62) * bands * delta * maxfac * intensity * 0.16;
    shimmer += irid * (fac3 + fac4) * delta * intensity * 0.12;

    vec3 lit = base + shimmer;
    vec3 screen = 1.0 - (1.0 - base) * (1.0 - shimmer * 0.38);
    vec3 color = mix(lit, screen, clamp(foilAmt * 0.45, 0.0, 0.55));

    gl_FragColor = vec4(color * texel.a, texel.a);
}
`;
