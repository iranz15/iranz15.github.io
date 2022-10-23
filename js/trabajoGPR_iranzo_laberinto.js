import * as THREE from 'three';
import * as CANNON from 'https://unpkg.com/cannon-es@0.19.0/dist/cannon-es.js'; 
import { OrbitControls } from 'https://unpkg.com/three@0.140.1/examples/jsm/controls/OrbitControls.js';
import {TWEEN} from '../lib/tween.module.min.js'
import {GUI} from '../lib/lil-gui.module.min.js'
import {JoyStick} from './joystick.js'

// Constantes y variables
const materialSuelo = new CANNON.Material("materialSuelo");
const materialEsfera = new CANNON.Material("materialEsfera");
const gradosRotacion = 20;
let renderer, scene, camera, cameraControls;
let joystick, HUD;
let conts = 1;
let world;
let pelota,planoBase;

// Metodos inicializadores

init();
loadWorld();
//controles(); setupGUI
render();

function mapIntervalo( value, leftMin, leftMax, rightMin, rightMax )
{
  return rightMin + ( value - leftMin ) * ( rightMax - rightMin ) / ( leftMax - leftMin );
}

function init() {

    joystick = new JoyStick({});
    console.log(joystick)
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


function esfera( radio, masa, posicion, material, material_textura ){
	this.body = new CANNON.Body( {mass: masa, material: material} );
	this.body.addShape( new CANNON.Sphere( radio ) );
	this.body.position.copy( posicion );
	this.visual = new THREE.Mesh( new THREE.SphereGeometry( radio ), material_textura);
	this.visual.position.copy( this.body.position );
}

function plano( ancho, material, material_textura){
    const planeShape = new CANNON.Plane()
    this.body = new CANNON.Body({ mass: 0,material: material})
    this.body.addShape(planeShape)
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);


    const planeGeometry = new THREE.PlaneGeometry(ancho, ancho)
    this.visual = new THREE.Mesh(planeGeometry, material_textura)
    this.visual.receiveShadow = true
    this.visual.rotation.x = -Math.PI/2;

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
    const materialSueloAspecto = new THREE.MeshLambertMaterial({
        color: 'white',
        map: sueloTx
    })

    // Suelo
    /*
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
    */
    planoBase = new plano( 40, materialSuelo, materialSueloAspecto );
    world.addBody( planoBase.body );
    scene.add( planoBase.visual );
    //Esfera
    pelota = new esfera( 2, 40, new CANNON.Vec3( -1, 20, 0 ), materialEsfera, materialSueloAspecto );
    world.addBody( pelota.body );
    scene.add( pelota.visual );

    //planeGeometry.holes.push( hole );
}


function update() {
    world.fixedStep();

    let angleX = mapIntervalo ( joystick.posJoyX,-1,1,-gradosRotacion,gradosRotacion );
    let angleY = mapIntervalo ( joystick.posJoyY,-1,1,-gradosRotacion,gradosRotacion ); 
    console.log('X:',angleX,'  Y:',angleY)
    let quatX = new CANNON.Quaternion();
    let quatY = new CANNON.Quaternion();
    let quatBase = new CANNON.Quaternion();
    quatX.setFromAxisAngle(new CANNON.Vec3(0,0,-1), (Math.PI/180) * angleX);
    quatY.setFromAxisAngle(new CANNON.Vec3(-1,0,0), (Math.PI/180) * angleY);
    quatBase.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2)
    let quaternion = quatX.mult(quatY).mult(quatBase);
    quaternion.normalize();
    planoBase.body.quaternion = quaternion;

    
    pelota.visual.position.copy( pelota.body.position );
    pelota.visual.quaternion.copy( pelota.body.quaternion );
    planoBase.visual.position.copy( planoBase.body.position );
    planoBase.visual.quaternion.copy( planoBase.body.quaternion );



    TWEEN.update();
    //console.log()


    
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


