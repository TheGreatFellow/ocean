import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import imagesLoaded from 'imagesloaded'
import FontFaceObserver from 'fontfaceobserver'
import vertex from './shaders/vertex.glsl'
import fragment from './shaders/fragment.glsl'
import { Scroll } from './scroll'
import ocean from '../images/ocean.jpg'

export default class Sketch {
    constructor(options) {
        this.time = 0
        this.container = options.dom
        this.scene = new THREE.Scene()

        this.width = this.container.offsetWidth
        this.height = this.container.offsetHeight

        this.camera = new THREE.PerspectiveCamera(
            70,
            this.width / this.height,
            100,
            2000
        )
        this.camera.position.z = 600
        this.camera.fov = (2 * Math.atan(this.height / 2 / 600) * 180) / Math.PI
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        this.renderer.setSize(this.width, this.height)
        this.container.appendChild(this.renderer.domElement)

        this.images = [...document.querySelectorAll('img')]

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)

        const fontOpen = new Promise((resolve) => {
            new FontFaceObserver('Open Sans').load().then(() => {
                resolve()
            })
        })

        const fontPlayfair = new Promise((resolve) => {
            new FontFaceObserver('Playfair Display').load().then(() => {
                resolve()
            })
        })

        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(
                document.querySelectorAll('img'),
                { background: true },
                resolve
            )
        })

        let allDone = [fontOpen, fontPlayfair, preloadImages]
        this.currentScroll = 0

        Promise.all(allDone).then(() => {
            this.scroll = new Scroll()
            this.addImages()
            this.setPosition()

            this.resize()
            this.setupResize()
            // this.addObjects()
            this.render()

            // window.addEventListener('scroll', () => {
            //     this.currentScroll = window.scrollY
            //     this.setPosition()
            // })
        })
    }

    setupResize() {
        window.addEventListener('resize', this.resize.bind(this))
    }

    resize() {
        this.width = this.container.offsetWidth
        this.height = this.container.offsetHeight
        this.renderer.setSize(this.width, this.height)
        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()
    }

    addImages() {
        this.imageStore = this.images.map((img) => {
            let bounds = img.getBoundingClientRect()

            let geometry = new THREE.PlaneBufferGeometry(
                bounds.width,
                bounds.height,
                1,
                1
            )
            let texture = new THREE.Texture(img)
            texture.needsUpdate = true
            let material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                map: texture,
            })

            let mesh = new THREE.Mesh(geometry, material)

            this.scene.add(mesh)

            return {
                img: img,
                mesh: mesh,
                top: bounds.top,
                left: bounds.left,
                width: bounds.width,
                height: bounds.height,
            }
        })

        console.log(this.imageStore)
    }

    setPosition() {
        this.imageStore.forEach((o) => {
            o.mesh.position.y =
                this.currentScroll - o.top + this.height / 2 - o.height / 2
            o.mesh.position.x = o.left - this.width / 2 + o.width / 2
        })
    }

    addObjects() {
        this.geometry = new THREE.PlaneBufferGeometry(200, 400, 10, 10)
        // this.geometry = new THREE.SphereBufferGeometry(0.4, 40, 40)
        this.material = new THREE.MeshNormalMaterial()

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                oceanTexture: { value: new THREE.TextureLoader().load(ocean) },
            },
            side: THREE.DoubleSide,
            wireframe: true,
            fragmentShader: fragment,
            vertexShader: vertex,
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.scene.add(this.mesh)
    }

    render() {
        this.time += 0.05

        this.scroll.render()
        this.currentScroll = this.scroll.scrollToRender()
        this.setPosition()

        // this.mesh.rotation.x = this.time / 2000
        // this.mesh.rotation.y = this.time / 1000
        // this.material.uniforms.time.value = this.time
        this.renderer.render(this.scene, this.camera)
        window.requestAnimationFrame(this.render.bind(this))
    }
}

new Sketch({
    dom: document.getElementById('container'),
})
