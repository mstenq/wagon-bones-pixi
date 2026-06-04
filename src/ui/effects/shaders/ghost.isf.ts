/** Spectral green tint on card/die artwork. */
export const GHOST_AURA_ISF = String.raw`/*{
    "DESCRIPTION": "Green spectral tint on input artwork",
    "ISFVSN": "2",
    "CATEGORIES": ["Stylize", "Filter"],
    "INPUTS": [
        { "NAME": "inputImage", "TYPE": "image" },
        { "NAME": "invert_amount", "TYPE": "float", "DEFAULT": 1.0, "MIN": 0.0, "MAX": 1.0 },
        { "NAME": "tint_amount", "TYPE": "float", "DEFAULT": 0.72, "MIN": 0.0, "MAX": 1.0 },
        { "NAME": "saturation", "TYPE": "float", "DEFAULT": 0.35, "MIN": 0.0, "MAX": 1.0 },
        { "NAME": "brightness", "TYPE": "float", "DEFAULT": 1.02, "MIN": 0.5, "MAX": 1.5 },
        { "NAME": "pulse", "TYPE": "float", "DEFAULT": 0.0, "MIN": 0.0, "MAX": 1.0 },
        { "NAME": "tint_color", "TYPE": "color", "DEFAULT": [0.031, 0.78, 0.722, 1.0] }
    ]
}*/

void main() {
    vec2 uv = isf_FragNormCoord;
    vec4 src = IMG_NORM_PIXEL(inputImage, uv);
    vec3 rgb = mix(src.rgb, vec3(1.0) - src.rgb, invert_amount);

    float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
    vec3 gray = vec3(luma);
    vec3 saturated = mix(gray, rgb, saturation);
    vec3 tinted = mix(saturated, saturated * tint_color.rgb * 1.15, tint_amount);
    tinted += tint_color.rgb * 0.06 * tint_amount;
    float breathe = 1.0 + pulse * 0.08;
    vec3 out_rgb = tinted * brightness * breathe;

    gl_FragColor = vec4(out_rgb * src.a, src.a);
}
`;
