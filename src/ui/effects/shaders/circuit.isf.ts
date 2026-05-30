/** Living circuit board — ArtTech / FREQUENCIES OF THE UNHEARD (ISF filter). */
export const CIRCUIT_ISF = String.raw`/*{
    "DESCRIPTION": "Living circuit board - breathing schematic with flickering LEDs, subtle pulses, and organic data flow. Designed for MadMapper.",
    "CREDIT": "ArtTech / FREQUENCIES OF THE UNHEARD",
    "CATEGORIES": ["Generator", "Filter"],
    "ISFVSN": "2",
    "INPUTS": [
        {
            "NAME": "inputImage",
            "TYPE": "image",
            "LABEL": "Circuit Schematic"
        },
        {
            "NAME": "breathSpeed",
            "TYPE": "float",
            "DEFAULT": 0.25,
            "MIN": 0.0,
            "MAX": 2.0,
            "LABEL": "Breath Speed"
        },
        {
            "NAME": "breathDepth",
            "TYPE": "float",
            "DEFAULT": 0.35,
            "MIN": 0.0,
            "MAX": 1.0,
            "LABEL": "Breath Depth"
        },
        {
            "NAME": "ledDensity",
            "TYPE": "float",
            "DEFAULT": 0.6,
            "MIN": 0.0,
            "MAX": 1.0,
            "LABEL": "LED Density"
        },
        {
            "NAME": "ledFlickerSpeed",
            "TYPE": "float",
            "DEFAULT": 1.5,
            "MIN": 0.0,
            "MAX": 8.0,
            "LABEL": "LED Flicker Speed"
        },
        {
            "NAME": "ledBrightness",
            "TYPE": "float",
            "DEFAULT": 1.6,
            "MIN": 0.0,
            "MAX": 4.0,
            "LABEL": "LED Brightness"
        },
        {
            "NAME": "ledSize",
            "TYPE": "float",
            "DEFAULT": 0.0035,
            "MIN": 0.0005,
            "MAX": 0.02,
            "LABEL": "LED Size"
        },
        {
            "NAME": "pulseSpeed",
            "TYPE": "float",
            "DEFAULT": 0.4,
            "MIN": 0.0,
            "MAX": 3.0,
            "LABEL": "Data Pulse Speed"
        },
        {
            "NAME": "pulseIntensity",
            "TYPE": "float",
            "DEFAULT": 0.45,
            "MIN": 0.0,
            "MAX": 2.0,
            "LABEL": "Data Pulse Intensity"
        },
        {
            "NAME": "scanlineAmount",
            "TYPE": "float",
            "DEFAULT": 0.08,
            "MIN": 0.0,
            "MAX": 1.0,
            "LABEL": "Scanline Amount"
        },
        {
            "NAME": "glowAmount",
            "TYPE": "float",
            "DEFAULT": 0.55,
            "MIN": 0.0,
            "MAX": 2.0,
            "LABEL": "Trace Glow"
        },
        {
            "NAME": "colorTintR",
            "TYPE": "float",
            "DEFAULT": 0.65,
            "MIN": 0.0,
            "MAX": 1.5,
            "LABEL": "Tint R"
        },
        {
            "NAME": "colorTintG",
            "TYPE": "float",
            "DEFAULT": 0.95,
            "MIN": 0.0,
            "MAX": 1.5,
            "LABEL": "Tint G"
        },
        {
            "NAME": "colorTintB",
            "TYPE": "float",
            "DEFAULT": 1.1,
            "MIN": 0.0,
            "MAX": 1.5,
            "LABEL": "Tint B"
        },
        {
            "NAME": "ledHue",
            "TYPE": "float",
            "DEFAULT": 0.55,
            "MIN": 0.0,
            "MAX": 1.0,
            "LABEL": "LED Hue Shift"
        },
        {
            "NAME": "vignette",
            "TYPE": "float",
            "DEFAULT": 0.25,
            "MIN": 0.0,
            "MAX": 1.0,
            "LABEL": "Vignette"
        }
    ]
}*/


// ---------- hashing / noise ----------
float hash21(vec2 p) {
    // Precision-safe range for mediump fragment shaders.
    p = fract(p * vec2(0.1031, 0.1030));
    p += dot(p, p.yx + 33.33);
    return fract((p.x + p.y) * p.x);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// HSV -> RGB for LED color
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// luma helper
float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

vec2 clamp01(vec2 u) {
    return clamp(u, vec2(0.0), vec2(1.0));
}


void main() {
    vec2 uv = isf_FragNormCoord;
    vec4 src = IMG_NORM_PIXEL(inputImage, clamp01(uv));
    vec2 px = 1.0 / RENDERSIZE;

    // ---------- 1) breathing: very slow, organic ----------
    // two slightly detuned sines + a touch of noise = lung-like rhythm
    float t = TIME * breathSpeed;
    float breath = 0.5 + 0.5 * sin(t * 6.2831);
    float breath2 = 0.5 + 0.5 * sin(t * 6.2831 * 0.37 + 1.3);
    float breathN = vnoise(vec2(TIME * 0.07, 3.7)) * 0.15;
    float breathing = mix(breath, breath2, 0.4) + breathN;
    breathing = clamp(breathing, 0.0, 1.0);

    // micro-drift of the image to feel like it's "inhaling"
    float drift = (breathing - 0.5) * breathDepth * 0.004;
    vec2 sampleUV = clamp01(uv + vec2(drift * 0.3, drift));

    // base schematic
    vec3 base = IMG_NORM_PIXEL(inputImage, sampleUV).rgb;
    float lum = luma(base);

    // ---------- 2) trace glow: blur-like sample around bright traces ----------
    vec3 glow = vec3(0.0);
    float gw = 0.0;
    for (int i = -2; i <= 2; i++) {
        for (int j = -2; j <= 2; j++) {
            vec2 o = vec2(float(i), float(j)) * px * 1.6;
            float w = exp(-float(i*i + j*j) * 0.35);
            glow += IMG_NORM_PIXEL(inputImage, clamp01(sampleUV + o)).rgb * w;
            gw += w;
        }
    }
    glow /= gw;
    float glowMask = smoothstep(0.25, 0.85, luma(glow));
    vec3 glowColor = glow * glowMask * glowAmount * (0.7 + 0.3 * breathing);

    // ---------- 3) data pulse traveling across traces ----------
    // pulses are diagonal waves modulated by the schematic's brightness
    // so they only "light up" where there are actual traces
    float pulse = 0.0;
    for (int k = 0; k < 3; k++) {
        float fk = float(k);
        float ang = 0.7 + fk * 1.9;
        vec2 dir = vec2(cos(ang), sin(ang));
        float coord = dot(uv, dir) * 4.0 - TIME * pulseSpeed * (0.6 + fk * 0.35);
        float wave = sin(coord * 6.2831);
        wave = pow(max(wave, 0.0), 18.0);
        pulse += wave;
    }
    pulse *= pulseIntensity;
    float traceMask = smoothstep(0.35, 0.9, lum);
    vec3 pulseColor = vec3(0.4, 0.85, 1.0) * pulse * traceMask;

    // ---------- 4) tiny flickering LEDs ----------
    // grid of candidate LED positions, each one randomly enabled / phased
    vec3 leds = vec3(0.0);
    float cellSize = 0.022; // ~ density of candidate spots
    vec2 gid = floor(uv / cellSize);

    // check current cell + a few neighbors so LEDs aren't grid-locked
    for (int gx = -1; gx <= 1; gx++) {
        for (int gy = -1; gy <= 1; gy++) {
            vec2 cell = gid + vec2(float(gx), float(gy));
            float r1 = hash21(cell);
            // only some cells host an LED
            if (r1 > (1.0 - ledDensity)) {
                // jitter LED position inside cell
                float jx = hash21(cell + 17.0);
                float jy = hash21(cell + 91.0);
                vec2 ledPos = (cell + vec2(jx, jy)) * cellSize;

                // only place LEDs where the schematic has bright structure
                // (samples the source so LEDs sit on components / pads / traces)
                vec3 localSrc = IMG_NORM_PIXEL(inputImage, clamp01(ledPos)).rgb;
                float localLum = luma(localSrc);
                if (localLum > 0.18) {
                    // distance to LED in screen space (aspect-corrected)
                    vec2 d = uv - ledPos;
                    d.x *= RENDERSIZE.x / RENDERSIZE.y;
                    float dist = length(d);

                    // per-LED timing
                    float phase = hash21(cell + 3.1) * 6.2831;
                    float speed = mix(0.4, 1.8, hash21(cell + 5.7)) * ledFlickerSpeed;
                    float flick = 0.5 + 0.5 * sin(TIME * speed + phase);

                    // some LEDs blink hard, some breathe softly
                    float style = hash21(cell + 11.3);
                    if (style > 0.7) {
                        // sharp blinker: long off, short on
                        float blink = step(0.85, fract(TIME * speed * 0.25 + phase));
                        flick = mix(flick, blink, 0.85);
                    } else if (style > 0.4) {
                        // gentle pulse
                        flick = pow(flick, 2.5);
                    } else {
                        // tiny twinkle with noise
                        flick *= 0.5 + 0.5 * hash21(cell + floor(TIME * speed * 3.0));
                    }

                    // sync overall LED population with breathing slightly
                    flick *= mix(0.55, 1.0, breathing);

                    // soft round dot + outer halo
                    float core = exp(-dist * dist / (ledSize * ledSize));
                    float halo = exp(-dist * dist / (ledSize * ledSize * 18.0)) * 0.35;
                    float intensity = (core + halo) * flick * ledBrightness;

                    // per-LED color: small variation around the chosen hue
                    float hueJ = hash21(cell + 23.0) * 0.12 - 0.06;
                    vec3 col = hsv2rgb(vec3(ledHue + hueJ, 0.75, 1.0));

                    // a few LEDs are warm/amber for contrast
                    if (hash21(cell + 41.0) > 0.85) {
                        col = hsv2rgb(vec3(0.08, 0.85, 1.0));
                    }

                    leds += col * intensity;
                }
            }
        }
    }

    // ---------- 5) compose ----------
    vec3 tint = vec3(colorTintR, colorTintG, colorTintB);
    vec3 color = base * tint;
    color += glowColor * tint;
    color += pulseColor;
    color += leds;

    // overall breathing brightness on the schematic itself (very subtle)
    float breathLift = 1.0 + (breathing - 0.5) * breathDepth * 0.5;
    color *= breathLift;

    // ---------- 6) scanlines (very soft, optional) ----------
    float scan = 0.5 + 0.5 * sin(uv.y * RENDERSIZE.y * 3.14159 + TIME * 2.0);
    color *= mix(1.0, scan, scanlineAmount * 0.5);

    // ---------- 7) vignette ----------
    vec2 vUV = uv - 0.5;
    float vig = 1.0 - dot(vUV, vUV) * vignette * 2.5;
    vig = clamp(vig, 0.0, 1.0);
    color *= vig;

    // gentle tonemap so highlights from LEDs don't clip flat
    color = color / (1.0 + color * 0.35);

    gl_FragColor = vec4(color * src.a, src.a);
}
`;
