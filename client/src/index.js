
const createRegl = require('regl')
const glsl = require('glslify')
const mat4 = require('gl-mat4')
const createCamera = require('3d-view-controls')
const css = require('dom-css')
const fit = require('canvas-fit')
const { GUI } = require('dat-gui')
const array = require('new-array')
const shuffle = require('shuffle-array')
const Alea = require('alea')
const { createSpring } = require('spring-animator')
const Delaunator = require('delaunator')
const createAnalyser = require('web-audio-analyser')
const createTitleCard = require('./title-card')
const createAudioControls = require('./audio-controls')
const createRenderBloom = require('./render-bloom')
const createRenderBlur = require('./render-blur')
const createRenderGrid = require('./render-grid')

const titleCard = createTitleCard()
const canvas = document.querySelector('canvas.viz')
const resize = fit(canvas)
window.addEventListener('resize', () => { resize(); setup() }, false)
const camera = createCamera(canvas)
const regl = createRegl(canvas)

camera.zoomSpeed = 4
camera.lookAt(
  [2.5, 2.5, 2.5],
  [0, 0, 0],
  [0.52, -0.11, 50]
)

let analyser, delaunay, points, positions, positionsBuffer, renderFrequencies,
  renderGrid, blurredFbo, renderToBlurredFBO

const getFrameBuffer = (width, height) => (
  regl.framebuffer({
    color: regl.texture({
      shape: [width, height, 4]
    }),
    depth: false,
    stencil: false
  })
)

const fbo = getFrameBuffer(512, 512)
const freqMapFBO = getFrameBuffer(512, 512)

const renderToFBO = regl({ framebuffer: fbo })
const renderToFreqMapFBO = regl({ framebuffer: freqMapFBO })

const renderBloom = createRenderBloom(regl, canvas)
const renderBlur = createRenderBlur(regl)

const tracks = [
  {title: 'Fade - Alan Walker', artist:"Alan Walker" , path: 'http://localhost:5000/defaultMusic/AlanWalker-Fade[NCSRelease].mp3'},
  {title: 'Fade - Alan Walker', artist:"Alan Walker" , path: 'http://localhost:5000/defaultMusic/AlanWalker-Fade[NCSRelease].mp3'},
  {title: 'Fade - Alan Walker', artist:"Alan Walker" , path: 'http://localhost:5000/defaultMusic/AlanWalker-Fade[NCSRelease].mp3'},
  {title: 'Fade - Alan Walker', artist:"Alan Walker" , path: 'http://localhost:5000/defaultMusic/AlanWalker-Fade[NCSRelease].mp3'},
  {title: 'Fade - Alan Walker', artist:"Alan Walker" , path: 'http://localhost:5000/defaultMusic/AlanWalker-Fade[NCSRelease].mp3'}
]
setupAudio(tracks).then(([audioAnalyser, audio]) => {
  const audioControls = createAudioControls(audio, tracks)

  function loop () {
    window.requestAnimationFrame(loop)
    audioControls.tick()
  }

  analyser = audioAnalyser
  analyser.analyser.fftSize = 1024 * 2
  analyser.analyser.minDecibels = -75
  analyser.analyser.maxDecibels = -30
  analyser.analyser.smoothingTimeConstant = 0.5

  titleCard.show().then(() => {
    css(audioControls.el, {
      transition: 'opacity 1s linear',
      opacity: 1
    })
    css(gui.domElement.parentElement, {
      transition: 'opacity 1s linear',
      opacity: 1
    })
    window.requestAnimationFrame(loop)
    audio.play()
    setup()
    startLoop()
  })
})

const settings = {
  seed: 0,

  points: 2500,
  dampening: 0.7,
  stiffness: 0.55,
  freqPow: 1.7,
  connectedNeighbors: 4,
  neighborWeight: 0.99,
  connectedBinsStride: 1,
  blurAngle: 0.25,
  blurMag: 7,

  blurRadius: 3,
  blurWeight: 0.8,
  originalWeight: 1.2,

  gridLines: 130,
  linesDampening: 0.02,
  linesStiffness: 0.9,
  linesAnimationOffset: 20,
  gridMaxHeight: 0.28,
  roam: true
}

const gui = new GUI()
gui.closed = true
css(gui.domElement.parentElement, {
  zIndex: 11,
  opacity: 0
})
const fabricGUI = gui.addFolder('fabric')
fabricGUI.add(settings, 'dampening', 0.01, 1).step(0.01).onChange(setup)
fabricGUI.add(settings, 'stiffness', 0.01, 1).step(0.01).onChange(setup)
fabricGUI.add(settings, 'connectedNeighbors', 0, 7).step(1).onChange(setup)
fabricGUI.add(settings, 'neighborWeight', 0.8, 1).step(0.01)
const bloomGUI = gui.addFolder('bloom')
bloomGUI.add(settings, 'blurRadius', 0, 20).step(1)
bloomGUI.add(settings, 'blurWeight', 0, 2).step(0.01)
bloomGUI.add(settings, 'originalWeight', 0, 2).step(0.01)
const gridGUI = gui.addFolder('grid')
gridGUI.add(settings, 'gridLines', 1, 180).step(1).onChange(setup)
gridGUI.add(settings, 'linesAnimationOffset', 0, 100).step(1)
gridGUI.add(settings, 'gridMaxHeight', 0.01, 0.8).step(0.01)
gui.add(settings, 'roam')

function setup () {
  const rand = new Alea(settings.seed)
  points = []

  blurredFbo = getFrameBuffer(canvas.width, canvas.height)
  renderToBlurredFBO = regl({ framebuffer: blurredFbo })

  renderGrid = createRenderGrid(regl, settings)

  // fill up the points list with the freqency-tracking nodes
  const frequenciesCount = analyser.frequencies().length // 1024
  for (let q = 0; q < frequenciesCount; q += settings.connectedBinsStride) {
    const mag = Math.pow(rand(), 1 - q / frequenciesCount) * 0.9
    const rads = rand() * Math.PI * 2
    const position = [
      Math.cos(rads) * mag,
      Math.sin(rads) * mag
      // rand() * 2 - 1,
      // rand() * 2 - 1
    ]
    const id = points.length
    const point = createPoint(id, position)
    point.frequencyBin = q
    points.push(point)
  }

  array(Math.max(0, settings.points - points.length)).forEach((_, i) => {
    const id = points.length
    points.push(createPoint(id, [rand() * 2 - 1, rand() * 2 - 1]))
  })

  function createPoint (id, position) {
    return {
      position: position,
      id: id,
      neighbors: new Set(), // gonna fill this up with the results of delaunay
      spring: createSpring(settings.dampening * settings.stiffness, settings.stiffness, 0)
    }
  }

  delaunay = new Delaunator(points.map((pt) => pt.position))
  for (let j = 0; j < delaunay.triangles.length; j += 3) {
    const pt1 = delaunay.triangles[j]
    const pt2 = delaunay.triangles[j + 1]
    const pt3 = delaunay.triangles[j + 2]

    points[pt1].neighbors.add(pt2)
    points[pt1].neighbors.add(pt3)
    points[pt2].neighbors.add(pt1)
    points[pt2].neighbors.add(pt3)
    points[pt3].neighbors.add(pt1)
    points[pt3].neighbors.add(pt2)
  }

  points.forEach(pt => {
    pt.neighbors = shuffle(Array.from(pt.neighbors)).slice(0, settings.connectedNeighbors)
  })

  positions = new Float32Array(delaunay.triangles.length * 3)
  positionsBuffer = regl.buffer(positions)

  renderFrequencies = regl({
    vert: glsl`
      attribute vec3 position;
      varying vec4 fragColor;
      void main() {
        float actualIntensity = position.z * 1.2;
        fragColor = vec4(vec3(actualIntensity), 1);
        gl_Position = vec4(position.xy, 0, 1);
      }
    `,
    frag: glsl`
      precision highp float;
      varying vec4 fragColor;
      void main() {
        gl_FragColor = fragColor;
      }
    `,
    attributes: {
      position: positionsBuffer
    },
    count: delaunay.triangles.length,
    primitive: 'triangles'
  })
}

function update () {
  const frequencies = analyser.frequencies()
  points.forEach(pt => {
    let value = 0
    if (pt.frequencyBin || pt.frequencyBin === 0) {
      value = Math.pow(frequencies[pt.frequencyBin] / 255, settings.freqPow) // max bin value
    }
    const neighbors = pt.neighbors
    const neighborSum = neighbors.reduce((total, ptID) => {
      return total + points[ptID].spring.tick(1, false)
    }, 0)
    const neighborAverage = neighbors.length ? neighborSum / neighbors.length : 0
    value = Math.max(value, neighborAverage * settings.neighborWeight)

    pt.spring.updateValue(value)
    pt.spring.tick()
  })

  for (let j = 0; j < delaunay.triangles.length; j++) {
    const ptIndex = delaunay.triangles[j]
    const point = points[ptIndex]
    positions[j * 3] = point.position[0]
    positions[j * 3 + 1] = point.position[1]
    positions[j * 3 + 2] = point.spring.tick(1, false)
  }

  positionsBuffer(positions)
}

const renderGlobals = regl({
  uniforms: {
    projection: ({viewportWidth, viewportHeight}) => mat4.perspective(
      [],
      Math.PI / 4,
      viewportWidth / viewportHeight,
      0.01,
      1000
    ),
    view: () => camera.matrix,
    eye: () => camera.eye,
    time: ({ time }) => time
  }
})

function startLoop () {
  regl.frame(({ time }) => {
    camera.tick()
    camera.up = [camera.up[0], camera.up[1], 999]
    if (settings.roam) {
      camera.center = [
        Math.sin(time / 12) * 2.5,
        Math.cos(time / 12) * 4.5,
        (Math.sin(time / 12) * 0.5 + 0.5) * 3 + 0.5
      ]
    }
    update()
    renderToFBO(() => {
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1
      })
      renderFrequencies()
    })
    renderToFreqMapFBO(() => {
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1
      })
      const rads = settings.blurAngle * Math.PI
      const direction = [
        Math.cos(rads) * settings.blurMag,
        Math.sin(rads) * settings.blurMag
      ]
      renderBlur({
        iChannel0: fbo,
        direction: direction
      })
    })
    renderToBlurredFBO(() => {
      regl.clear({
        color: [0.18, 0.18, 0.18, 1],
        depth: 1
      })
      renderGlobals(() => {
        renderGrid({
          frequencyVals: freqMapFBO,
          gridMaxHeight: settings.gridMaxHeight,
          multiplier: 1
        })
      })
    })

    renderBloom({
      iChannel0: blurredFbo,
      blurMag: settings.blurRadius,
      blurWeight: settings.blurWeight,
      originalWeight: settings.originalWeight
    })
  })
}

// ///// helpers (to abstract down the line?) //////

function setupAudio (tracks) {
  const audio = new window.Audio()
  audio.crossOrigin = 'anonymous'
  audio.src = tracks[0].path

  return new Promise((resolve, reject) => {
    audio.addEventListener('canplay', function onLoad () {
      audio.removeEventListener('canplay', onLoad)
      const analyser = createAnalyser(audio, { audible: true, stereo: false })
      resolve([analyser, audio])
    })
  })
}