import * as THREE from 'three';
import * as CANNON from 'https://unpkg.com/cannon-es@0.19.0/dist/cannon-es.js'; 
import { OrbitControls } from 'https://unpkg.com/three@0.140.1/examples/jsm/controls/OrbitControls.js';
import {TWEEN} from '../lib/tween.module.min.js'
import {GUI} from '../lib/lil-gui.module.min.js'
import {JoyStick} from './joystick.js'
import { OBJLoader } from 'https://unpkg.com/three@0.140.1/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://unpkg.com/three@0.140.1/examples/jsm/loaders/MTLLoader.js';
import 'https://unpkg.com/jimp@0.5.2/browser/lib/jimp.js';

import  {RGBELoader} from "https://unpkg.com/three@0.140.1/examples/jsm/loaders/RGBELoader.js"
import "https://unpkg.com/three@0.140.1/examples/jsm/postprocessing/EffectComposer.js";
import "https://unpkg.com/three@0.140.1/examples/jsm/postprocessing/RenderPass.js";
import "https://unpkg.com/three@0.140.1/examples/jsm/postprocessing/ShaderPass.js";
import "https://unpkg.com/three@0.140.1/examples/jsm/postprocessing/UnrealBloomPass.js";
import "https://unpkg.com/three@0.140.1/examples/jsm/shaders/LuminosityHighPassShader.js";
import "https://unpkg.com/three@0.140.1/examples/jsm/shaders/CopyShader.js";


// Constantes y variables
const materialSuelo = new CANNON.Material("materialSuelo");
const materialEsfera = new CANNON.Material("materialEsfera");

const gradosRotacion = 20;
let renderer, scene, camera, cameraControls;
let joystick, HUD;
let conts = 1;
let world;
let pelota,planoBase,visualKirby,bodyKirby,cristal_laberinto;
let visualLaberinto, bodyLaberinto;
let luzPuntual;
let cargando = 1;
let cubos = []

let cargado_laberinto = false
const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();
const rgbLoader = new RGBELoader()

const options = {
    transmission: 1,
    thickness: 1.5,
    roughness: 0.07,
    envMapIntensity: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    normalScale: 1,
    clearcoatNormalScale: 0.3,
    normalRepeat: 1,
    bloomThreshold: 0.85,
    bloomStrength: 0.5,
    bloomRadius: 0.33,
  };

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
    camera.position.set(20, 60, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //setCameras(ar);
    aplicaLuces();
    
    cameraControls = new OrbitControls( camera,renderer.domElement );
    cameraControls.target.set(0,0,0)
    window.addEventListener('resize', updateAspectRatio );
}

function aplicaLuces(){
    const luzAmb = new THREE.AmbientLight(0xd3d3d3);

    const luzDir = new THREE.DirectionalLight(0xFFFFFF, 0.7);
    luzDir.position.set(-1,1,-1);
    luzDir.castShadow = true;
    //let helper = new THREE.DirectionalLightHelper( luzDir, 1 );
    /*
    //scene.add(helper)

    luzFocal = new THREE.SpotLight(0xFFFFFF,0.5)
    luzFocal.position.set(-2,7,4)
    luzFocal.target.position.set(0,0,0)
    luzFocal.angle = Math.PI/7;
    luzFocal.castShadow = true;
    */
    luzPuntual = new THREE.PointLight(0xFFFFFF, 0.5);
    luzPuntual.position.set(0,5,-8);
    luzPuntual.castShadow = true;
    scene.add(luzDir)
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

function cubo( masa, posicion, material, material_textura ){
	this.body = new CANNON.Body( {mass: masa, material: material} );
	this.body.addShape( new CANNON.Box(new CANNON.Vec3(1, 1, 1)) );
	this.body.position.copy( posicion );
	this.visual = new THREE.Mesh( new THREE.BoxGeometry( 1,1,1 ), material_textura);
	this.visual.position.copy( this.body.position );
}

function plano( ancho,material, material_textura){
    const planeShape = new CANNON.Plane()
    this.body = new CANNON.Body({ mass: 0,material: material})
    this.body.addShape(planeShape)
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);


    const planeGeometry = new THREE.PlaneGeometry(ancho, ancho)
    this.visual = new THREE.Mesh(planeGeometry, material_textura)
    this.visual.receiveShadow = true
    this.visual.rotation.x = -Math.PI/2;
    this.visual.position.copy( this.body.position );
}

function kirby(radio, masa, posicion, material ){

    mtlLoader.load(
        './kirby_ball/ballkirby.mtl',
        (materials) => {
            materials.preload();
            objLoader.setMaterials( materials );
            objLoader.load(
                './kirby_ball/ballkirby.obj',
                (object) => {
                    // el modelo es 2 de radio, escalar por el radio pasado
                    const escalado = radio/2
                    object.scale.set(escalado,escalado,escalado) 
                    object.receiveShadow = true;
                    object.name = 'kirby'
                    object.position.copy(posicion);
                    visualKirby = object
                    scene.add(object)

                    let body = new CANNON.Body( {mass: masa, material: material} );
                    body.addShape( new CANNON.Sphere( radio ) );
                    body.position.copy( posicion );
                    bodyKirby = body
                    world.addBody( body );

                    cargando--;

                }   
            )
        }
    )
    /*
    mtlLoader.load(
        './models/lab/maz1.mtl',
        (materials) => {
            materials.preload();
            objLoader.setMaterials( materials );
            objLoader.load(
                './models/lab/maz1.obj',
                (object) => {
                    // el modelo es 2 de radio, escalar por el radio pasado
                    visualLaberinto = object
                    object.position.y = 10
                    scene.add(object)
                    createConvexHull()
                    console.log('dsd')

                    cargando--;

                }   
            )
        }
    )
    */


}



function loadWorld() {
    
    // Init mundo de fisicas
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -40, 0)
    })
    scene.add(new THREE.AxesHelper(1000));
    
    const sphereGroundContactMaterial = new CANNON.ContactMaterial(materialSuelo,materialEsfera,
        { friction: 0.7, 
            restitution: 0.9 });
    world.addContactMaterial(sphereGroundContactMaterial);

    //p.2, 0.7
    // Texturas
    const path = '../images/'
    const textureLoader = new THREE.TextureLoader()
    const sueloTx = textureLoader.load(path + 'pisometalico_1024.jpg')
    const sueloNormalTx = textureLoader.load(path + 'pisometalico_1024    _norm.jpg')


    const maderaTx = textureLoader.load(path + "wood.jpg");
    const maderaNormalTx = textureLoader.load(path + "wood_norm.jpg");
    maderaNormalTx.wrapS = THREE.RepeatWrapping;
    maderaNormalTx.wrapT = THREE.RepeatWrapping;
    

    // Materiales
    const materialSueloAspecto = new THREE.MeshLambertMaterial({
        color: 'white',
        map: sueloTx,
        normalmap: sueloNormalTx,
        side : THREE.DoubleSide
    })

    const materialMadera = new THREE.MeshPhongMaterial({
        color: 'white',
        map: maderaTx,
        normalmap: maderaNormalTx
    })
    
    const hdrEquirect = rgbLoader.load(
      "../empty_warehouse_01_4k.hdr",
      () => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
      }
    );

    const cristal = new THREE.MeshPhysicalMaterial({
        transmission: options.transmission,
        thickness: options.thickness,
        roughness: options.roughness,
        envMap: hdrEquirect,



    });

    const cristal_panel = new THREE.MeshPhysicalMaterial({
        transmission: options.transmission,
        thickness: options.thickness,
        roughness: options.roughness,
        envMap: hdrEquirect,
        side : THREE.DoubleSide
      });
  




    let limit = 40   
    // Paredes
    
    const backWall = new CANNON.Body( {mass:0, material:materialSuelo} );
    backWall.addShape( new CANNON.Plane() );
    backWall.position.z = -limit;
    world.addBody( backWall );

    const frontWall = new CANNON.Body( {mass:0, material:materialSuelo} );
    frontWall.addShape( new CANNON.Plane() );
    frontWall.quaternion.setFromEuler(0,Math.PI,0,'XYZ');
    frontWall.position.z = limit;
    world.addBody( frontWall );

    const leftWall = new CANNON.Body( {mass:0, material:materialSuelo} );
    leftWall.addShape( new CANNON.Plane() );
    leftWall.position.x = -limit;
    leftWall.quaternion.setFromEuler(0,Math.PI/2,0,'XYZ');
    world.addBody( leftWall );

    const rightWall = new CANNON.Body( {mass:0, material:materialSuelo} );
    rightWall.addShape( new CANNON.Plane() );
    rightWall.position.x = limit;
    rightWall.quaternion.setFromEuler(0,-Math.PI/2,0,'XYZ');
    world.addBody( rightWall );
    

    // Suelo
    cristal_laberinto = new plano( 80, materialSuelo, cristal_panel );
    // cristal_laberinto.body.material.side = THREE.DoubleSide;
    cristal_laberinto.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),Math.PI/2);
    cristal_laberinto.body.position.y = 20;
    world.addBody( cristal_laberinto.body );
    scene.add( cristal_laberinto.visual );

    planoBase = new plano( 80, materialSuelo, materialSueloAspecto );
    world.addBody( planoBase.body );
    scene.add( planoBase.visual );



    
    //Esfera
    pelota = new esfera( 2, 200, new CANNON.Vec3( -1, 2.1, 0 ), materialEsfera, cristal );
    world.addBody( pelota.body );
    scene.add( pelota.visual );

    kirby(2, 200, new CANNON.Vec3( 10, 12, 0 ), materialEsfera);

    //let imgElement = Jimp.read('../kirby_ball/t0011_0.png');
    //
    Jimp.read('../images/tet.png', (err, kb) => {
        if (err) throw err;
        let mat = cv.matFromImageData( kb.bitmap);
        console.log(mat)
        let dst = new cv.Mat();
        cv.cvtColor(mat, dst, cv.COLOR_RGBA2GRAY)
        info(mat)
        info(dst)
		const circle = document.getElementById("b1");
        circle.height = window.innerHeight
		circle.style.cssText = "position:absolute; bottom:0px; width:100px; width:100px;  ";
        cv.imshow(circle,dst)
        let cuentas = []
        for(let i = 0;i< dst.size().width;i++){
            for(let j = 0;j< dst.size().height;j++){
                let pointer = dst.ucharAt(i, j * dst.channels());
                console.log(pointer)
                if ( pointer == 0){
                let xd = new cubo( 2, new CANNON.Vec3( i, 4, j  ), materialEsfera, materialMadera );
                world.addBody( xd.body );
                scene.add( xd.visual );
                cubos.push(xd)
                cuentas.push([i,j])

                
                }
            }
        }
        cargado_laberinto = true
        console.log(cubos,cuentas)
        console.log("Done")
        var byr = 8
      });
 
    //console.log(mat);

    //planeGeometry.holes.push( hole );

}

function info(image){
    console.log('image width: ' + image.cols + '\n' +
            'image height: ' + image.rows + '\n' +
            'image size: ' + image.size().width + '*' + image.size().height + '\n' +
            'image depth: ' + image.depth() + '\n' +
            'image channels ' + image.channels() + '\n' +
            'image type: ' + image.type() + '\n');
}

function update() {
    world.fixedStep();

    let angleX = mapIntervalo ( joystick.posJoyX,-1,1,-gradosRotacion,gradosRotacion );
    let angleY = mapIntervalo ( joystick.posJoyY,-1,1,-gradosRotacion,gradosRotacion ); 
    //console.log('X:',angleX,'  Y:',angleY)
    let quatX = new CANNON.Quaternion();
    let quatY = new CANNON.Quaternion();
    let quatBase = new CANNON.Quaternion();
    quatX.setFromAxisAngle(new CANNON.Vec3(0,0,-1), (Math.PI/180) * angleX);
    quatY.setFromAxisAngle(new CANNON.Vec3(-1,0,0), (Math.PI/180) * angleY);
    quatBase.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2)
    let quaternion = quatX.mult(quatY).mult(quatBase);
    quaternion.normalize();
    planoBase.body.quaternion = quaternion;
    cristal_laberinto.body.quaternion = quaternion;

    
    pelota.visual.position.copy( pelota.body.position );
    pelota.visual.quaternion.copy( pelota.body.quaternion );
    planoBase.visual.position.copy( planoBase.body.position );
    planoBase.visual.quaternion.copy( planoBase.body.quaternion );
    cristal_laberinto.visual.position.copy( cristal_laberinto.body.position );
    cristal_laberinto.visual.quaternion.copy( cristal_laberinto.body.quaternion );

    visualKirby.position.copy( bodyKirby.position );
    visualKirby.quaternion.copy( bodyKirby.quaternion );
 
   
    for (let i = 0;i<cubos.length;i++){
		cubos[i].visual.position.copy( cubos[i].body.position );
		cubos[i].visual.quaternion.copy( cubos[i].body.quaternion );

    }
    
    

    TWEEN.update();


}


function render() {

        requestAnimationFrame(render);
        if (cargando == 0 && cargado_laberinto == true){ // No comienza el bucle de renderizado hasta que los modelos esten cargados
            
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
}















