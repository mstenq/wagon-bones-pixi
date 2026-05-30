/** Underwater bubbles overlay on input image — stable MadMapper ISF. */
export const WATER_ISF = String.raw`/*{
  "DESCRIPTION": "Underwater bubbles overlay on input image - stable MadMapper ISF",
  "CREDIT": "ChatGPT for Kim Byungki",
  "ISFVSN": "2",
  "CATEGORIES": [
    "Filter",
    "Particles",
    "Water"
  ],
  "INPUTS": [
    {
      "NAME": "inputImage",
      "TYPE": "image"
    },
    {
      "NAME": "bubbleAmount",
      "TYPE": "float",
      "DEFAULT": 0.45,
      "MIN": 0.0,
      "MAX": 1.0
    },
    {
      "NAME": "bubbleSize",
      "TYPE": "float",
      "DEFAULT": 0.022,
      "MIN": 0.003,
      "MAX": 0.12
    },
    {
      "NAME": "smallBubbleMix",
      "TYPE": "float",
      "DEFAULT": 0.78,
      "MIN": 0.0,
      "MAX": 1.0
    },
    {
      "NAME": "riseSpeed",
      "TYPE": "float",
      "DEFAULT": 0.08,
      "MIN": 0.0,
      "MAX": 1.0
    },
    {
      "NAME": "driftAmount",
      "TYPE": "float",
      "DEFAULT": 0.02,
      "MIN": 0.0,
      "MAX": 0.25
    },
    {
      "NAME": "turbulence",
      "TYPE": "float",
      "DEFAULT": 0.2,
      "MIN": 0.0,
      "MAX": 2.0
    },
    {
      "NAME": "ringThickness",
      "TYPE": "float",
      "DEFAULT": 0.15,
      "MIN": 0.03,
      "MAX": 0.5
    },
    {
      "NAME": "bubbleSoftness",
      "TYPE": "float",
      "DEFAULT": 0.012,
      "MIN": 0.001,
      "MAX": 0.08
    },
    {
      "NAME": "bubbleBrightness",
      "TYPE": "float",
      "DEFAULT": 1.25,
      "MIN": 0.0,
      "MAX": 4.0
    },
    {
      "NAME": "bubbleOpacity",
      "TYPE": "float",
      "DEFAULT": 0.8,
      "MIN": 0.0,
      "MAX": 1.0
    },
    {
      "NAME": "depthFade",
      "TYPE": "float",
      "DEFAULT": 0.45,
      "MIN": 0.0,
      "MAX": 1.0
    },
    {
      "NAME": "waterRipple",
      "TYPE": "float",
      "DEFAULT": 0.006,
      "MIN": 0.0,
      "MAX": 0.05
    },
    {
      "NAME": "waterTintAmount",
      "TYPE": "float",
      "DEFAULT": 0.18,
      "MIN": 0.0,
      "MAX": 1.0
    },
    {
      "NAME": "contrast",
      "TYPE": "float",
      "DEFAULT": 1.05,
      "MIN": 0.2,
      "MAX": 3.0
    },
    {
      "NAME": "darkness",
      "TYPE": "float",
      "DEFAULT": 0.08,
      "MIN": 0.0,
      "MAX": 1.0
    },
    {
      "NAME": "waterTint",
      "TYPE": "color",
      "DEFAULT": [0.48, 0.62, 0.72, 1.0]
    },
    {
      "NAME": "bubbleColor",
      "TYPE": "color",
      "DEFAULT": [0.86, 0.95, 1.0, 1.0]
    }
  ]
}*/

#define MAX_BUBBLES 120

// Precision-safe hash for mediump fragment shaders.
float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float softCircle(float d, float r, float s) {
    return 1.0 - smoothstep(r - s, r + s, d);
}

void main() {
    vec2 uv = isf_FragNormCoord.xy;
    float aspect = RENDERSIZE.x / RENDERSIZE.y;
    float t = TIME;

    vec2 rippleUV = uv;
    rippleUV.x += sin(uv.y * 18.0 + t * 0.7) * waterRipple;
    rippleUV.y += sin(uv.x * 11.0 - t * 0.45) * waterRipple * 0.6;

    rippleUV = min(max(rippleUV, vec2(0.0, 0.0)), vec2(1.0, 1.0));

    vec4 src = IMG_NORM_PIXEL(inputImage, rippleUV);
    vec3 base = src.rgb;

    base = mix(base, base * waterTint.rgb, waterTintAmount);
    base *= (1.0 - darkness);
    base = (base - 0.5) * contrast + 0.5;
    base = min(max(base, vec3(0.0)), vec3(1.0));

    float ringAccum = 0.0;
    float glowAccum = 0.0;
    float highAccum = 0.0;
    float maskAccum = 0.0;

    for (int i = 0; i < MAX_BUBBLES; i++) {
        float fi = float(i);
        float active = step(fi / float(MAX_BUBBLES), bubbleAmount);

        float rx = hash11(fi + 1.123);
        float ry = hash11(fi + 2.357);
        float rs = hash11(fi + 3.791);
        float rsp = hash11(fi + 4.639);
        float phase = hash11(fi + 5.911) * 6.2831853;
        float rsmall = hash11(fi + 6.271);

        float sizeFactor;
        if (rsmall < smallBubbleMix) {
            sizeFactor = 0.22 + rs * 0.45;
        } else {
            sizeFactor = 0.70 + rs * 1.10;
        }

        float radius = bubbleSize * sizeFactor;
        float speed = riseSpeed * (0.45 + rsp * 1.35);

        float y = fract(ry - t * speed);

        float drift = sin(t * (0.7 + rsp * 1.3) + phase + y * 8.0) * driftAmount;
        drift += sin(t * (1.5 + rsp * 1.7) + phase * 1.7) * driftAmount * turbulence * 0.5;

        float x = fract(rx + drift);

        vec2 p = vec2((uv.x - x) * aspect, uv.y - y);
        float d = length(p);

        float soft = bubbleSoftness * (0.7 + rs * 1.4);

        float outer = softCircle(d, radius, soft);
        float inner = softCircle(d, radius * (1.0 - ringThickness), soft * 1.1);
        float ring = max(outer - inner * 0.85, 0.0);
        float body = outer * 0.10;

        float h1 = softCircle(length(p - vec2(-radius * 0.26, radius * 0.26)), radius * 0.22, soft * 0.7);
        float h2 = softCircle(length(p - vec2(radius * 0.15, -radius * 0.12)), radius * 0.08, soft * 0.4);
        float highlight = h1 * 0.85 + h2 * 0.5;

        float depth = mix(1.0, smoothstep(0.0, 1.0, y), depthFade);

        ringAccum += ring * active * depth;
        glowAccum += body * active * depth;
        highAccum += highlight * active * depth;
        maskAccum += outer * active * depth;
    }

    ringAccum = min(ringAccum, 1.0);
    glowAccum = min(glowAccum, 1.0);
    highAccum = min(highAccum, 1.0);
    maskAccum = min(maskAccum, 1.0);

    vec3 bubbleLayer = vec3(0.0);
    bubbleLayer += bubbleColor.rgb * glowAccum * 0.22;
    bubbleLayer += bubbleColor.rgb * ringAccum * bubbleBrightness;
    bubbleLayer += vec3(1.0) * highAccum * bubbleBrightness * 1.15;

    float overlayMask = min(max(maskAccum * bubbleOpacity, 0.0), 1.0);

    vec3 outRgb = mix(base, base + bubbleLayer, overlayMask);
    outRgb = min(max(outRgb, vec3(0.0)), vec3(1.0));

    gl_FragColor = vec4(outRgb, src.a);
}
`;
