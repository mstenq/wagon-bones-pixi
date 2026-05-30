/** Polychrome rainbow tint — adapted from Godot canvas_item shader. */
export const POLYCHROME_ISF = String.raw`/*{
    "DESCRIPTION": "Spatial rainbow hue cycling over card art",
    "ISFVSN": "2",
    "CATEGORIES": ["Stylize", "Filter"],
    "INPUTS": [
        {
            "NAME": "inputImage",
            "TYPE": "image"
        },
        {
            "NAME": "saturation",
            "TYPE": "float",
            "DEFAULT": 0.6,
            "MIN": 0.0,
            "MAX": 1.0,
            "LABEL": "Saturation"
        },
        {
            "NAME": "offset",
            "TYPE": "point2D",
            "DEFAULT": [0.0, 0.0],
            "LABEL": "Hue Offset"
        },
        {
            "NAME": "spatialScale",
            "TYPE": "float",
            "DEFAULT": 0.25,
            "MIN": 0.0,
            "MAX": 1.0,
            "LABEL": "Spatial Scale"
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
    vec4 src = IMG_NORM_PIXEL(inputImage, uv);
    float hue = (uv.x + uv.y) * spatialScale + (offset.x + offset.y) * 4.0;
    vec3 rgb = src.rgb * hsv2rgb(vec3(hue, saturation, 1.0));
    gl_FragColor = vec4(rgb * src.a, src.a);
}
`;
