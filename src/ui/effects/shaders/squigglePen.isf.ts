/** Squiggle pen hand-drawn edge lines — adapted from Godot canvas_item shader. */
export const SQUIGGLE_PEN_ISF = String.raw`/*{
    "DESCRIPTION": "Hand-drawn squiggly pen strokes on image edges",
    "ISFVSN": "2",
    "CATEGORIES": ["Stylize", "Filter"],
    "INPUTS": [
        {
            "NAME": "inputImage",
            "TYPE": "image"
        },
        {
            "NAME": "weight",
            "TYPE": "float",
            "DEFAULT": 0.07,
            "MIN": 0.0,
            "MAX": 1.0,
            "LABEL": "Edge Weight"
        },
        {
            "NAME": "line_thickness",
            "TYPE": "float",
            "DEFAULT": 1.0,
            "MIN": 0.0,
            "MAX": 6.0,
            "LABEL": "Line Thickness"
        },
        {
            "NAME": "paperColor",
            "TYPE": "color",
            "DEFAULT": [0.96, 0.92, 0.84, 1.0],
            "LABEL": "Paper Color"
        },
        {
            "NAME": "color",
            "TYPE": "color",
            "DEFAULT": [0.0, 0.0, 0.0, 1.0],
            "LABEL": "Line Color"
        },
        {
            "NAME": "opacity",
            "TYPE": "float",
            "DEFAULT": 1.0,
            "MIN": 0.0,
            "MAX": 1.0,
            "LABEL": "Line Opacity"
        },
        {
            "NAME": "scale",
            "TYPE": "point2D",
            "DEFAULT": [10.0, 10.0],
            "LABEL": "Noise Scale"
        },
        {
            "NAME": "strength",
            "TYPE": "float",
            "DEFAULT": 0.5,
            "MIN": 0.0,
            "MAX": 2.0,
            "LABEL": "Squiggle Strength"
        },
        {
            "NAME": "fps",
            "TYPE": "float",
            "DEFAULT": 6.0,
            "MIN": 0.0,
            "MAX": 30.0,
            "LABEL": "Squiggle FPS"
        }
    ]
}*/

float hash21(vec2 p) {
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

vec2 clamp01(vec2 u) {
    return clamp(u, vec2(0.0), vec2(1.0));
}

void main() {
    vec2 uv = isf_FragNormCoord;
    vec4 src = IMG_NORM_PIXEL(inputImage, uv);
    vec2 px = 1.0 / RENDERSIZE;

    vec2 noise_uv = uv * scale;

    vec2 offset_multiplier = vec2(3.14159265, 2.718281828);
    vec2 noise_offset = vec2(floor(TIME * fps)) * offset_multiplier;
    float noise_sample = vnoise(noise_uv + noise_offset) * 4.0 * 3.14159265;
    vec2 direction = vec2(cos(noise_sample), sin(noise_sample));
    vec2 squiggle_uv = clamp01(uv + direction * strength * 0.005);

    vec3 current_color = IMG_NORM_PIXEL(inputImage, squiggle_uv).rgb;
    vec3 right_color = IMG_NORM_PIXEL(
        inputImage,
        clamp01(squiggle_uv + vec2(px.x * line_thickness, 0.0))
    ).rgb;
    vec3 bottom_color = IMG_NORM_PIXEL(
        inputImage,
        clamp01(squiggle_uv - vec2(0.0, px.y * line_thickness))
    ).rgb;
    float r_distance = length(current_color - right_color);
    float b_distance = length(current_color - bottom_color);

    bool isEdge = r_distance > weight || b_distance > weight;
    vec3 paper_rgb = paperColor.rgb;
    vec3 line_rgb = color.rgb;
    vec3 outRgb = isEdge ? mix(paper_rgb, line_rgb, opacity) : paper_rgb;

    gl_FragColor = vec4(outRgb * src.a, src.a);
}
`;
