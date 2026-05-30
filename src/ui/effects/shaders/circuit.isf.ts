/** Animated circuit traces — adapted from Godot canvas_item shader. */
export const CIRCUIT_ISF = String.raw`/*{
    "DESCRIPTION": "Animated orthogonal circuit traces with traveling head glow",
    "ISFVSN": "2",
    "CATEGORIES": ["Stylize", "Filter"],
    "INPUTS": [
        {
            "NAME": "inputImage",
            "TYPE": "image"
        },
        {
            "NAME": "line_width",
            "TYPE": "float",
            "DEFAULT": 0.01,
            "MIN": 0.001,
            "MAX": 0.1,
            "LABEL": "Line Width"
        },
        {
            "NAME": "segment_count",
            "TYPE": "long",
            "DEFAULT": 8,
            "MIN": 0,
            "MAX": 10,
            "LABEL": "Segment Count"
        },
        {
            "NAME": "segment_length",
            "TYPE": "float",
            "DEFAULT": 0.06,
            "MIN": 0.03,
            "MAX": 1.0,
            "LABEL": "Segment Length"
        },
        {
            "NAME": "tail_lag",
            "TYPE": "float",
            "DEFAULT": 0.4,
            "MIN": 0.1,
            "MAX": 1.0,
            "LABEL": "Tail Lag"
        },
        {
            "NAME": "line_colour",
            "TYPE": "color",
            "DEFAULT": [0.15, 0.95, 0.35, 1.0],
            "LABEL": "Line Color"
        },
        {
            "NAME": "head_size_multiplier",
            "TYPE": "float",
            "DEFAULT": 5.0,
            "MIN": 0.0,
            "MAX": 10.0,
            "LABEL": "Head Size Multiplier"
        },
        {
            "NAME": "head_colour",
            "TYPE": "color",
            "DEFAULT": [0.6, 1.0, 0.7, 1.0],
            "LABEL": "Head Color"
        },
        {
            "NAME": "line_count",
            "TYPE": "long",
            "DEFAULT": 10,
            "MIN": 0,
            "MAX": 200,
            "LABEL": "Line Count"
        },
        {
            "NAME": "line_lifetime",
            "TYPE": "float",
            "DEFAULT": 5.0,
            "MIN": 0.5,
            "MAX": 10.0,
            "LABEL": "Line Lifetime"
        },
        {
            "NAME": "animation_speed",
            "TYPE": "float",
            "DEFAULT": 0.5,
            "MIN": 0.05,
            "MAX": 3.0,
            "LABEL": "Animation Speed"
        },
        {
            "NAME": "start_direction_degrees",
            "TYPE": "float",
            "DEFAULT": 0.0,
            "MIN": 0.0,
            "MAX": 360.0,
            "LABEL": "Start Direction (degrees)"
        },
        {
            "NAME": "random_start_direction",
            "TYPE": "bool",
            "DEFAULT": 1,
            "LABEL": "Random Start Direction"
        },
        {
            "NAME": "instance_seed",
            "TYPE": "float",
            "DEFAULT": 0.0,
            "MIN": 0.0,
            "MAX": 10000.0,
            "LABEL": "Instance Seed"
        }
    ]
}*/

const int MAX_SEGMENTS = 10;
const int MAX_LINES = 200;

float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float line_hash(int line_index, int cycle, float salt) {
    float s = float(line_index) * 17.13 + float(cycle) * 9.17 + instance_seed * 0.3187 + salt * 4.91;
    return hash11(s);
}

vec2 hash22(vec2 p) {
    p = fract(p * vec2(0.1031, 0.1030));
    p += dot(p, p.yx + 33.33);
    return fract(vec2(p.x * p.y, p.x + p.y));
}

vec2 line_spawn(int line_index, int cycle) {
    float inset = 0.08;
    float span = (1.0 - inset * 2.0) * 0.5;

    int quadrant = int(mod(float(line_index + cycle), 4.0));
    vec2 origin;
    if (quadrant == 0) {
        origin = vec2(inset, inset);
    } else if (quadrant == 1) {
        origin = vec2(inset + span, inset);
    } else if (quadrant == 2) {
        origin = vec2(inset, inset + span);
    } else {
        origin = vec2(inset + span, inset + span);
    }

    vec2 jitter = hash22(
        vec2(float(line_index) * 3.17 + float(cycle) * 1.41, instance_seed * 0.001 + 19.7)
    );
    return origin + jitter * span * 0.95;
}

float get_start_angle(int line_index, int cycle, vec2 spawn) {
    if (random_start_direction == 0) {
        return radians(start_direction_degrees);
    }

    vec2 to_center = vec2(0.5) - spawn;
    float center_angle = atan(to_center.y, to_center.x);
    float snapped = floor((center_angle + radians(22.5)) / radians(45.0)) * radians(45.0);

    if (line_hash(line_index, cycle, 3.0) < 0.35) {
        float rand_dir = floor(line_hash(line_index, cycle, 31.0) * 8.0);
        return rand_dir * radians(45.0);
    }

    return snapped + (line_hash(line_index, cycle, 37.0) - 0.5) * radians(45.0);
}

float get_turn(int line_index, int cycle, int segment, float initial, float angle_size) {
    float choice = line_hash(line_index, cycle, float(segment) + 7.0);
    if (choice < 0.333) {
        return initial + angle_size;
    }
    if (choice < 0.666) {
        return initial - angle_size;
    }
    return initial;
}

float aspect_distance(vec2 a, vec2 b, float aspect) {
    vec2 ca = a - vec2(0.5);
    vec2 cb = b - vec2(0.5);
    ca.y *= aspect;
    cb.y *= aspect;
    return distance(ca, cb);
}

float get_segment_intensity(
    vec2 start,
    vec2 end,
    vec2 segment_process_range,
    float progress,
    vec2 uv,
    float aspect
) {
    vec2 segment_vec = end - start;

    vec2 pixel_vec_segment = uv - start;
    float t = clamp(
        dot(pixel_vec_segment, segment_vec) / (segment_length * segment_length),
        0.0,
        1.0
    );
    vec2 closest_point = start + t * segment_vec;
    float distance_to_segment = aspect_distance(uv, closest_point, aspect);

    float point_progress = mix(segment_process_range.x, segment_process_range.y, t);

    if (
        point_progress <= min(progress, 1.0 - tail_lag)
        && point_progress >= progress - tail_lag
    ) {
        float intensity = 1.0 - smoothstep(0.0, line_width, distance_to_segment);
        float lit_progress = (point_progress - (progress - tail_lag)) / tail_lag;
        return intensity * lit_progress;
    }

    return 0.0;
}

float render_line(
    float time,
    int line_index,
    float lifetime,
    vec2 uv,
    float aspect,
    out float head_intensity
) {
    head_intensity = 0.0;

    float local_time = time / lifetime;
    int cycle = int(floor(local_time));
    float progress = fract(local_time);

    float line_intensity = 0.0;

    vec2 last_point = line_spawn(line_index, cycle);
    float last_angle = get_start_angle(line_index, cycle, last_point);
    vec2 last_dir = vec2(cos(last_angle), sin(last_angle));

    float last_progress = 0.0;

    for (int j = 0; j < MAX_SEGMENTS; j++) {
        if (j >= segment_count) {
            break;
        }

        vec2 segment_bounds = vec2(
            last_progress,
            last_progress + (1.0 - tail_lag) / float(segment_count)
        );
        last_progress = segment_bounds.y;
        if (progress < segment_bounds.x) {
            break;
        }

        vec2 next_point = last_point + last_dir * segment_length;
        float next_angle = get_turn(line_index, cycle, j, last_angle, radians(45.0));
        vec2 next_dir = vec2(cos(next_angle), sin(next_angle));

        line_intensity = max(
            line_intensity,
            get_segment_intensity(last_point, next_point, segment_bounds, progress, uv, aspect)
        );

        if (progress >= segment_bounds.x && progress <= segment_bounds.y) {
            vec2 head_pos = last_point
                + last_dir * segment_length
                * (progress - segment_bounds.x)
                / (segment_bounds.y - segment_bounds.x);
            float head_glow = 1.0
                - smoothstep(
                    0.0,
                    line_width * head_size_multiplier,
                    aspect_distance(uv, head_pos, aspect)
                );
            head_intensity = head_glow;
        }

        last_point = next_point;
        last_angle = next_angle;
        last_dir = next_dir;
    }

    return line_intensity;
}

void main() {
    vec2 uvNorm = isf_FragNormCoord;
    vec4 src = IMG_NORM_PIXEL(inputImage, uvNorm);
    vec4 under_colour = src;

    float aspect_ratio = RENDERSIZE.x / max(RENDERSIZE.y, 1.0);
    vec2 uv = uvNorm;

    float line_intensity = 0.0;
    float head_intensity = 0.0;
    for (int i = 0; i < MAX_LINES; i++) {
        if (i >= line_count) {
            break;
        }

        float lifetime = line_lifetime * (0.55 + line_hash(i, 0, 11.0) * 0.9);
        float time_offset = line_hash(i, 0, 23.0) * lifetime * 2.5;
        float current_head;
        float current_line = render_line(
            TIME * animation_speed + time_offset,
            i,
            lifetime,
            uv,
            aspect_ratio,
            current_head
        );
        line_intensity = max(line_intensity, current_line);
        head_intensity = max(head_intensity, current_head);
    }

    vec4 outColor = mix(under_colour, line_colour, line_intensity * line_colour.a);
    outColor = mix(outColor, head_colour, head_intensity * head_colour.a);

    gl_FragColor = vec4(outColor.rgb * src.a, src.a);
}
`;
