/** Retro Dither — OpenAI GPT-5.5 for Meco (ISF filter). */
export const RETRO_DITHER_ISF = String.raw`/*{
    "DESCRIPTION": "Retro monochrome dithering shader with multiple algorithms",
    "CREDIT": "OpenAI GPT-5.5 for Meco",
    "ISFVSN": "2",
    "CATEGORIES": [
        "Stylize",
        "Retro",
        "Dither",
        "Halftone"
    ],
    "INPUTS": [
        {
            "NAME": "inputImage",
            "TYPE": "image"
        },
        {
            "NAME": "Brightness",
            "TYPE": "float",
            "DEFAULT": 0.0,
            "MIN": -1.0,
            "MAX": 1.0
        },
        {
            "NAME": "Contrast",
            "TYPE": "float",
            "DEFAULT": 1.2,
            "MIN": 0.0,
            "MAX": 5.0
        },
        {
            "NAME": "Scale",
            "TYPE": "float",
            "DEFAULT": 2.0,
            "MIN": 1.0,
            "MAX": 16.0
        },
        {
            "NAME": "Color1",
            "TYPE": "color",
            "DEFAULT": [0.121, 0.894, 0.909, 1.0]
        },
        {
            "NAME": "Color2",
            "TYPE": "color",
            "DEFAULT": [0.647, 0.353, 0.0, 1.0]
        },
        {
            "NAME": "Algorithm",
            "TYPE": "long",
            "DEFAULT": 4,
            "VALUES": [0,1,2,3,4,5,6,7],
            "LABELS": [
                "Bayer 2x2",
                "Bayer 4x4",
                "Bayer 8x8",
                "Floyd-Steinberg",
                "Atkinson",
                "Blue Noise",
                "Random Noise",
                "Ordered Dot"
            ]
        }
    ]
}*/


float luminance(vec3 c)
{
    return dot(c, vec3(0.299, 0.587, 0.114));
}

float rand(vec2 co)
{
    return fract(
        sin(dot(co.xy, vec2(12.9898, 78.233))) *
        43758.5453123
    );
}

float contrastAdjust(float value, float contrast)
{
    return ((value - 0.5) * contrast) + 0.5;
}

float blueNoise(vec2 uv)
{
    vec2 i = floor(uv);
    vec2 f = fract(uv);

    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x)
         + (c - a) * u.y * (1.0 - u.x)
         + (d - b) * u.x * u.y;
}

float bayer2x2(vec2 p)
{
    vec2 a = mod(floor(p), 2.0);

    if (a.x == 0.0 && a.y == 0.0) return 0.0 / 4.0;
    if (a.x == 1.0 && a.y == 0.0) return 2.0 / 4.0;
    if (a.x == 0.0 && a.y == 1.0) return 3.0 / 4.0;

    return 1.0 / 4.0;
}

float bayer4x4(vec2 p)
{
    vec2 a = mod(floor(p), 4.0);

    float x = a.x;
    float y = a.y;

    if (y == 0.0)
    {
        if (x == 0.0) return 0.0  / 16.0;
        if (x == 1.0) return 8.0  / 16.0;
        if (x == 2.0) return 2.0  / 16.0;
        return 10.0 / 16.0;
    }

    if (y == 1.0)
    {
        if (x == 0.0) return 12.0 / 16.0;
        if (x == 1.0) return 4.0  / 16.0;
        if (x == 2.0) return 14.0 / 16.0;
        return 6.0  / 16.0;
    }

    if (y == 2.0)
    {
        if (x == 0.0) return 3.0  / 16.0;
        if (x == 1.0) return 11.0 / 16.0;
        if (x == 2.0) return 1.0  / 16.0;
        return 9.0  / 16.0;
    }

    if (x == 0.0) return 15.0 / 16.0;
    if (x == 1.0) return 7.0  / 16.0;
    if (x == 2.0) return 13.0 / 16.0;

    return 5.0 / 16.0;
}

float bayer8x8(vec2 p)
{
    vec2 a = mod(floor(p), 8.0);

    float x = a.x;
    float y = a.y;

    float index = 0.0;

    index += mod(x * 0.5,   1.0) * 32.0;
    index += mod(y * 0.5,   1.0) * 16.0;
    index += mod(x * 0.25,  1.0) * 8.0;
    index += mod(y * 0.25,  1.0) * 4.0;
    index += mod(x * 0.125, 1.0) * 2.0;
    index += mod(y * 0.125, 1.0);

    return fract(index / 64.0);
}

float orderedDot(vec2 p)
{
    vec2 gv = fract(p / 6.0) - 0.5;

    float dist = length(gv);

    return smoothstep(0.45, 0.1, dist);
}

float sharpenLuma(vec2 uv, vec2 texel)
{
    float c  = luminance(IMG_NORM_PIXEL(inputImage, uv).rgb);

    float up = luminance(
        IMG_NORM_PIXEL(inputImage, uv + vec2(0.0, texel.y)).rgb
    );

    float dn = luminance(
        IMG_NORM_PIXEL(inputImage, uv - vec2(0.0, texel.y)).rgb
    );

    float lf = luminance(
        IMG_NORM_PIXEL(inputImage, uv - vec2(texel.x, 0.0)).rgb
    );

    float rt = luminance(
        IMG_NORM_PIXEL(inputImage, uv + vec2(texel.x, 0.0)).rgb
    );

    float blur = (up + dn + lf + rt) * 0.25;

    return c + (c - blur) * 0.6;
}

void main()
{
    vec2 uv = isf_FragNormCoord;

    vec2 resolution = RENDERSIZE.xy;

    float scale = max(1.0, Scale);

    vec2 pixelUV =
        floor(uv * resolution / scale) *
        scale / resolution;

    vec2 texel = 1.0 / resolution;

    vec3 src = IMG_NORM_PIXEL(inputImage, pixelUV).rgb;

    float lum = sharpenLuma(pixelUV, texel);

    lum = pow(clamp(lum, 0.0, 1.0), 0.9);

    lum += Brightness;
    lum = contrastAdjust(lum, Contrast);

    lum += (rand(pixelUV * resolution) - 0.5) * 0.015;

    lum = clamp(lum, 0.0, 1.0);

    vec2 p = floor(pixelUV * resolution / scale);

    vec2 rp = vec2(
        p.x * 0.866 - p.y * 0.5,
        p.x * 0.5   + p.y * 0.866
    );

    float threshold = 0.5;

    if (Algorithm == 0)
    {
        threshold = bayer2x2(rp);
    }
    else if (Algorithm == 1)
    {
        threshold = bayer4x4(rp);
    }
    else if (Algorithm == 2)
    {
        threshold = bayer8x8(rp);
    }
    else if (Algorithm == 3)
    {
        float noise = rand(rp * 0.73);

        threshold =
            0.5 +
            (noise - 0.5) * 0.22;
    }
    else if (Algorithm == 4)
    {
        float pattern =
            sin(rp.x * 1.7) *
            sin(rp.y * 1.3);

        threshold =
            0.5 +
            pattern * 0.12 +
            (rand(rp) - 0.5) * 0.08;
    }
    else if (Algorithm == 5)
    {
        threshold = blueNoise(rp * 0.75);
    }
    else if (Algorithm == 6)
    {
        threshold = rand(rp);
    }
    else if (Algorithm == 7)
    {
        threshold = orderedDot(rp);
    }

    float bw = step(threshold, lum);

    vec3 finalColor =
        mix(Color2.rgb, Color1.rgb, bw);

    float paper =
        (rand(uv * resolution * 0.5) - 0.5) * 0.03;

    finalColor += paper;

    gl_FragColor =
        vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`;
