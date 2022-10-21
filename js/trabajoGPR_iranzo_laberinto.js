import * as THREE from 'three';
import * as CANNON from 'https://unpkg.com/cannon-es@0.19.0/dist/cannon-es.js'; 
import { OrbitControls } from 'https://unpkg.com/three@0.140.1/examples/jsm/controls/OrbitControls.js';
import {TWEEN} from '../lib/tween.module.min.js'
import {GUI} from '../lib/lil-gui.module.min.js'
import {JoyStick} from './joystick.js'

// Constantes y variables
const materialSuelo = new CANNON.Material("materialSuelo");
const materialEsfera = new CANNON.Material("materialEsfera");
let renderer, scene, camera, cameraControls;
let joystick, HUD;
let world;
let pelota;

// Metodos inicializadores

init();
loadWorld();
//controles(); setupGUI
render();

function init() {

    joystick = new JoyStick({});
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0xffffff));
    renderer.autoClear = false;
    document.getElementById('container').appendChild(renderer.domElement);
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;

    scene = new THREE.Scene();
    
    const ar = window.innerWidth/window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //setCameras(ar);
    aplicaLuces();
    
    cameraControls = new OrbitControls( camera,renderer.domElement );
    cameraControls.target.set(0,0,0)
    window.addEventListener('resize', updateAspectRatio );
}

function aplicaLuces(){
    const luzAmb = new THREE.AmbientLight(0xd3d3d3);

    /*
    luzDir = new THREE.DirectionalLight(0xFFFFFF, 0.3);
    luzDir.position.set(-1,1,-1);
    luzDir.castShadow = true;
    //let helper = new THREE.DirectionalLightHelper( luzDir, 1 );
    //scene.add(helper)

    luzFocal = new THREE.SpotLight(0xFFFFFF,0.5)
    luzFocal.position.set(-2,7,4)
    luzFocal.target.position.set(0,0,0)
    luzFocal.angle = Math.PI/7;
    luzFocal.castShadow = true;

    luzPuntual = new THREE.PointLight(0xFFFFFF, 0.5);
    luzPuntual.position.set(2,7,-4);
    luzPuntual.castShadow = true;
    */
    scene.add(luzAmb);

}


function updateAspectRatio() {
    renderer.setSize(window.innerWidth,window.innerHeight);
    const ar = window.innerWidth/window.innerHeight;

    // perspectiva
    camera.aspect = ar;
    camera.updateProjectionMatrix();

    // ortografica
    //HUD.updateProjectionMatrix();
}


function esfera( radio, posicion, material ){
	var masa = 1;
	this.body = new CANNON.Body( {mass: masa, material: material} );
	this.body.addShape( new CANNON.Sphere( radio ) );
	this.body.position.copy( posicion );
	this.visual = new THREE.Mesh( new THREE.SphereGeometry( radio ), 
		          new THREE.MeshBasicMaterial( {wireframe: false } ) );
	this.visual.position.copy( this.body.position );
}


function loadWorld() {
    
    // Init mundo de fisicas
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0)
    })
    scene.add(new THREE.AxesHelper(1000));
    
    const sphereGroundContactMaterial = new CANNON.ContactMaterial(materialSuelo,materialEsfera,
        { friction: 0.7, 
            restitution: 0.7 });
    world.addContactMaterial(sphereGroundContactMaterial);

    // Texturas
    const path = '../images/'
    const sueloTx = new THREE.TextureLoader().load(path + 'pisometalico_1024.jpg')

    // Materiales
    const sueloMaterial = new THREE.MeshLambertMaterial({
        color: 'white',
        map: sueloTx
    })

    // Suelo
    const planeGeometry = new THREE.PlaneGeometry(25, 25)
    const planeMesh = new THREE.Mesh(planeGeometry, sueloMaterial)
    planeMesh.rotateX(-Math.PI / 2)
    planeMesh.receiveShadow = true
    scene.add(planeMesh)
    const planeShape = new CANNON.Plane()
    const planeBody = new CANNON.Body({ mass: 0 })
    planeBody.addShape(planeShape)
    planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    world.addBody(planeBody)

    //Esfera
    pelota = new esfera( 2, new CANNON.Vec3( -1, 10, 0 ), materialEsfera );
    world.addBody( pelota.body );
    scene.add( pelota.visual );
}


function update() {
    world.fixedStep();
    pelota.visual.position.copy( pelota.body.position );
    pelota.visual.quaternion.copy( pelota.body.quaternion );
    TWEEN.update();
}


function render() {
    requestAnimationFrame(render);
    update();
    renderer.clear();
    const ar = window.innerWidth/window.innerHeight;
    
    if (ar > 1){
        renderer.setViewport(0,window.innerHeight * 3/4,window.innerHeight *1/4,window.innerHeight *1/4);
    }
    else{
        renderer.setViewport(0,window.innerHeight - window.innerWidth/4,window.innerWidth/4, window.innerWidth/4);
    }
    
    //renderer.render(scene, HUD);
    
    renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
    renderer.render(scene, camera);  
}


