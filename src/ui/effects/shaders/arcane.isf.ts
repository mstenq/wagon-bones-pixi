/** Arcane edge lightning — adapted from a Godot canvas shader concept. */
export const ARCANE_ISF = String.raw`/*{
    "DESCRIPTION": "Arcane lightning that hugs the host alpha edge",
    "ISFVSN": "2",
    "CATEGORIES": ["Stylize", "Filter"],
    "INPUTS": [
        { "NAME": "inputImage", "TYPE": "image" },
        { "NAME": "noise", "TYPE": "image" },
        { "NAME": "noise2", "TYPE": "image" },
        { "NAME": "brightness", "TYPE": "float", "DEFAULT": 2.5, "MIN": 0.0, "MAX": 6.0 },
        { "NAME": "time_scale", "TYPE": "float", "DEFAULT": 1.0, "MIN": 0.1, "MAX": 4.0 },
        { "NAME": "edge_width", "TYPE": "float", "DEFAULT": 0.022, "MIN": 0.002, "MAX": 0.08 },
        { "NAME": "edge_softness", "TYPE": "float", "DEFAULT": 0.018, "MIN": 0.001, "MAX": 0.08 },
        { "NAME": "arc_density", "TYPE": "float", "DEFAULT": 0.6, "MIN": 0.0, "MAX": 0.98 },
        { "NAME": "spark_intensity", "TYPE": "float", "DEFAULT": 0.65, "MIN": 0.0, "MAX": 2.0 },
        { "NAME": "arc_color", "TYPE": "color", "DEFAULT": [0.55, 0.35, 1.0, 1.0] }
    ]
}*/

const float PI = 3.14159265359;

void main() {
    vec2 uv = isf_FragNormCoord;
    vec4 src = IMG_NORM_PIXEL(inputImage, uv);
    float t = TIME * time_scale;
    vec2 aspect_uv = vec2(
        (uv.x - 0.5) * (RENDERSIZE.x / max(RENDERSIZE.y, 1.0)) + 0.5,
        uv.y
    );
    float angle = atan(aspect_uv.y - 0.5, aspect_uv.x - 0.5) / (2.0 * PI) + 0.5;

    float a_center = src.a;
    float a_left = IMG_NORM_PIXEL(inputImage, uv - vec2(edge_width, 0.0)).a;
    float a_right = IMG_NORM_PIXEL(inputImage, uv + vec2(edge_width, 0.0)).a;
    float a_up = IMG_NORM_PIXEL(inputImage, uv - vec2(0.0, edge_width)).a;
    float a_down = IMG_NORM_PIXEL(inputImage, uv + vec2(0.0, edge_width)).a;
    float edge_grad = abs(a_left - a_right) + abs(a_up - a_down);
    float edge_mask = smoothstep(0.08, 0.42, edge_grad) * smoothstep(0.01, 1.0, a_center);

    vec2 noise_uv_a = vec2(fract(angle + t * 0.11), fract(t * 0.045 + a_center * 0.1));
    vec2 noise_uv_b = vec2(fract(angle * 0.6 - t * 0.17), fract(t * 0.08 + edge_grad * 0.4));
    float n1 = IMG_NORM_PIXEL(noise, noise_uv_a).r;
    float n2 = IMG_NORM_PIXEL(noise2, noise_uv_b).r;

    vec2 arc_uv = vec2(a_center * 1.5 + n1 * 0.22, fract(angle * 0.5 + t * 0.2));
    float lane = IMG_NORM_PIXEL(noise2, arc_uv).r;
    float arcs = smoothstep(arc_density, 1.0, lane * 0.7 + n1 * 0.2 + n2 * 0.25);
    float sparks = smoothstep(0.92, 1.0, n1 * n2 + n2 * 0.2);
    float flicker = 0.8 + 0.2 * sin((angle + n1) * 60.0 + t * 22.0);
    float intensity = edge_mask * ((arcs * 1.1) + sparks * spark_intensity) * flicker;
    vec3 glow = arc_color.rgb * intensity * brightness;

    vec3 out_rgb = src.rgb + glow;
    gl_FragColor = vec4(out_rgb * src.a, src.a);
}
`;
