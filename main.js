const vsrc = `#version 300 es
layout(location=0) in vec2 a_pos;
void main() {
    gl_Position = vec4(a_pos, 0, 1);
}
`

const fsrc = `#version 300 es
precision mediump float;
out vec4 o_color;
uniform vec2 res;
uniform vec3 cameraPos;
uniform int loop;
vec3 trans(vec3 p) {
    return mod(p, 4.0)-2.0;
}
float dist(vec3 p) {
    return length(trans(p))-1.0;
}
vec3 getNormal(vec3 p) {
    float d = dist(p);
    return normalize(vec3(dist(p+vec3(0.001,0,0))-d, dist(p+vec3(0,0.001,0))-d, dist(p+vec3(0,0,0.001))-d));
}
void main() {
    vec2 p = (gl_FragCoord.xy*2.0-res) / min(res.x,res.y);
    vec3 cameraDir = vec3(0,0,-1);
    vec3 cameraUp = vec3(0,1,0);
    vec3 cameraSide = cross(cameraDir, cameraUp);
    vec3 light = normalize(vec3(1,-1,-1));
    float targetDepth = 1.0;
    vec3 ray = normalize(cameraSide * p.x + cameraUp * p.y + cameraDir * targetDepth);
    vec3 pos = cameraPos;
    float d;
    for (int i = 0; i < loop; i++) {
        d = dist(pos);
        pos += ray*d;
    }
    if (abs(d) < 0.001) {
        vec3 normal = getNormal(pos);
        o_color = vec4(vec3(dot(-normal,light)),1);
    } else {
        o_color = vec4(0,0,0,1);
    }
}
`

const compileShader = (src, type) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
    }
    return shader
}

const compileProgram = (vsrc, fsrc) => {
    const vshader = compileShader(vsrc, gl.VERTEX_SHADER)
    const fshader = compileShader(fsrc, gl.FRAGMENT_SHADER)
    if (vshader === null || fshader === null) {
        return
    }
    const shader = gl.createProgram(vshader, fshader)
    gl.attachShader(shader, vshader)
    gl.attachShader(shader, fshader)
    gl.linkProgram(shader)
    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(shader))
    }
    return shader
}

const canvas = document.createElement('canvas')
canvas.style.verticalAlign = 'bottom'
const gl = canvas.getContext('webgl2')
if (gl === null) {
    throw Error('canvas getContext 2d error')
}
document.body.prepend(canvas);

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const shader = compileProgram(vsrc,fsrc)
gl.useProgram(shader)
gl.uniform2f(gl.getUniformLocation(shader, 'res'), window.innerWidth, window.innerHeight)
gl.uniform1i(gl.getUniformLocation(shader, 'loop'), 100)

const positions = [
    -1.0, -1.0,
    1.0, -1.0,
    1.0, 1.0,
    -1.0, 1.0
]
const vbo = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
gl.enableVertexAttribArray(0)
gl.vertexAttribPointer(0, 2, gl.FLOAT, false , 8, 0)

const indices = [
    0,1,2,0,2,3
]
const ebo = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW)

const draw = () => {
    gl.clearColor(1,1,1,1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, null)
}

gl.viewport(0, 0, window.innerWidth, window.innerHeight)
draw()

window.onresize = e => {
    gl.viewport(0, 0, window.innerWidth, window.innerHeight)
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    gl.uniform2f(gl.getUniformLocation(shader, 'res'), window.innerWidth, window.innerHeight)
    draw()
}

const cameraPos = {
    x: 0,
    y: 0,
    z: 0
}

document.addEventListener('keydown', ({key}) => {
    move = {
        x: 0,
        y: 0,
        z: 0
    }
    if (key === 'ArrowRight') {
        cameraPos.x += 0.1;
    }
    else if (key === 'ArrowLeft') {
        cameraPos.x -= 0.1;
    }
    else if (key === 'ArrowUp') {
        cameraPos.y += 0.1;
    }
    else if (key === 'ArrowDown') {
        cameraPos.y -= 0.1;
    }
    else if (key === 'w') {
        cameraPos.z -= 0.1;
    }
    else if (key === 's') {
        cameraPos.z += 0.1;
    }
    else if (key === 'd') {
        cameraPos.x += 0.1;
    }
    else if (key === 'a') {
        cameraPos.x -= 0.1;
    }
    gl.uniform3f(gl.getUniformLocation(shader, 'cameraPos'), cameraPos.x,cameraPos.y,cameraPos.z)
    draw()
})

const el = document.querySelector('#loop')
el.addEventListener('change', e => {
    gl.uniform1i(gl.getUniformLocation(shader, 'loop'), e.target.value)
    draw()
})