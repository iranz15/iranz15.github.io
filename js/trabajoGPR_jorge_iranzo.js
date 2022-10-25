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
import {EffectComposer} from "https://unpkg.com/three@0.140.1/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "https://unpkg.com/three@0.140.1/examples/jsm/postprocessing/RenderPass.js";
import "https://unpkg.com/three@0.140.1/examples/jsm/postprocessing/ShaderPass.js";
import {UnrealBloomPass} from "https://unpkg.com/three@0.140.1/examples/jsm/postprocessing/UnrealBloomPass.js";
import "https://unpkg.com/three@0.140.1/examples/jsm/shaders/LuminosityHighPassShader.js";
import "https://unpkg.com/three@0.140.1/examples/jsm/shaders/CopyShader.js";
import {GlitchPass} from "https://unpkg.com/three@0.140.1/examples/jsm/postprocessing/GlitchPass.js";

let composer, renderPass,bloomPass;
// Constantes y variables
const materialSuelo = new CANNON.Material("materialSuelo");
const materialEsfera = new CANNON.Material("materialEsfera");
const posNames = ["posx.jpg", "negx.jpg","posy.jpg", "negy.jpg","posz.jpg", "negz.jpg"]
const pelotas = []
const color = 0xFFFFFF;
const density = 0.007;
let listener;
let interruptor_on,interruptor_off;



let L=100;
const gradosRotacion = 20;
let currentOptions = [false,false]; // Noche
let renderer, scene, camera, cameraControls;
let joystick, paredMesh;
let habitacion;
let conts = 1;
let world;
let planoBase,visualKirby,bodyKirby,cristal_laberinto, pelota_roja,pelota_verde,pelota_azul;
let visualLaberinto, bodyLaberinto;
let luzAmb, luzDir,luzFocal
let luzPuntual;
let cargando = 1;
let cubos = []
let paredes;
let borraUIInicial = true;
let cenital;
let ambienceCasa,piano,noche;

let cargado_laberinto = false
const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();
const rgbLoader = new RGBELoader()

const options = {
    transmission: 1,
    thickness: 1.5,
    roughness: 0.02,
    envMapIntensity: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    normalScale: 0.05,
    clearcoatNormalScale: 0.3,
    normalRepeat: 1,
    bloomThreshold: 0.6,
    bloomStrength: 0.3,
    bloomRadius: 3
  };



// Metodos inicializadores

const startButton = document.getElementById( 'startButton' );
startButton.addEventListener( 'click', function () {
    init();
    loadWorld();
    render();
    
} );

function mapIntervalo( value, leftMin, leftMax, rightMin, rightMax )
{
  return rightMin + ( value - leftMin ) * ( rightMax - rightMin ) / ( leftMax - leftMin );
}

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
    scene.fog = new THREE.FogExp2(color, 0);
 
    
    const ar = window.innerWidth/window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1200);
    //40
    camera.position.set(0, 40, 40);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    aplicaLuces();
    
    cameraControls = new OrbitControls( camera,renderer.domElement );
    cameraControls.target.set(0,0,0)
    cameraControls.minDistance = 10;
    cameraControls.maxDistance = 60;
    cameraControls.maxPolarAngle = (Math.PI/180) * 140 ; 
    cameraControls.enableDamping=true;

    cameraControls.enableKeys = true //older versions
    cameraControls.listenToKeyEvents(document.body)
    cameraControls.keys = {
    LEFT: "ArrowLeft", //left arrow
    UP: "ArrowUp", // up arrow
    RIGHT: "ArrowRight", // right arrow
    BOTTOM: "ArrowDown" // down arrow
}
    window.addEventListener('resize', updateAspectRatio );
	window.addEventListener('keydown', onKeyDown );
    //

     renderPass = new RenderPass(scene, camera);
     bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.width, window.height),
      options.bloomStrength,
      options.bloomRadius,
      options.bloomThreshold
    );

    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);


    listener = new THREE.AudioListener();
    camera.add( listener );
    ambienceCasa = new THREE.Audio( listener );
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'audio/ruidos_fondo.wav', function( buffer ) {
    	ambienceCasa.setBuffer( buffer );
    	ambienceCasa.setLoop( true );
    	ambienceCasa.setVolume( 0.4 );
    	ambienceCasa.play();
    });

    piano = new THREE.Audio( listener );
    const cargaPiano = new THREE.AudioLoader();
    cargaPiano.load( 'audio/piano.wav', function( buffer ) {
    	piano.setBuffer( buffer );
    	piano.setLoop( true );
    	piano.setVolume( 0.4 );
    });

    noche = new THREE.Audio( listener );
    const cargaNoche = new THREE.AudioLoader();
    cargaNoche.load( 'audio/noche.wav', function( buffer ) {
    	noche.setBuffer( buffer );
    	noche.setLoop( true );
    	noche.setVolume( 0.4 );
    });




    const interruptor_loader_on = new THREE.AudioLoader();
    interruptor_on = new THREE.Audio( listener );
    interruptor_loader_on.load( 'audio/light_on.wav', function( buffer ) {
        interruptor_on.setBuffer( buffer );
        interruptor_on.setVolume( 0.8 );

    });




}

function onKeyDown(event) {

	var keyCode = event.code;
    console.log("Hola")

	switch(keyCode){
        
		case "KeyN": if (currentOptions[0] == false){

           
            currentOptions[0] = true;
            scene.fog.color.set('black');
            luzAmb.color.set('darkblue');
            for(let i=0;i<6;i++){ 
            habitacion.material[i].color.set('darkblue')
        }
        if(currentOptions[1] == true){
            piano.stop()
        }else {ambienceCasa.stop()}
        noche.play();
            
        } else {

            currentOptions[0] = false
            luzAmb.color.set('skyblue');
            scene.fog.color.set('white');
            for(let i=0;i<6;i++){ 
            habitacion.material[i].color.set('skyblue')
        }
        noche.stop();
        if(currentOptions[1] == true){
            piano.play()
        }else {ambienceCasa.play()}

        }
        interruptor_on.play();
        break;

        case "KeyF": if (currentOptions[1] == false){
            currentOptions[1] = true;
            scene.fog.density = 0.007;
           
            if(currentOptions[0] == false){ 
                ambienceCasa.stop()
                piano.play()
            } else {noche.play()}
        } else {
            currentOptions[1] = false
            if(currentOptions[0] == false){ 
                piano.stop()
                ambienceCasa.play()
            } else {noche.play()}
            scene.fog.density = 0

        }
        break;
        default:
            break;
        

	}
}

function aplicaLuces(){
    luzAmb = new THREE.AmbientLight('skyblue');

     let luzPuntual_r = new THREE.PointLight('red',2,20,2);
     luzPuntual_r.position.set(0, 5, 10 );
     luzPuntual_r.castShadow = true;
 
 
     let luzPuntual_g = new THREE.PointLight('green', 2,20,2);
     luzPuntual_g.position.set(-10, 5, -10);
     luzPuntual_g.castShadow = true;
 
     let luzPuntual_b = new THREE.PointLight('blue', 2,20,2);
     luzPuntual_b.position.set(10, 5, -10 );
     luzPuntual_b.castShadow = true;
 
     luzDir = new THREE.DirectionalLight(0xFFFFFF, 0.9);
     luzDir.position.set(100,100,80);
     luzDir.castShadow = true;


     scene.add(luzPuntual_g)
     scene.add(luzPuntual_b)
     scene.add(luzPuntual_r);
     scene.add(luzDir);

    scene.add(luzAmb);

}


function updateAspectRatio() {
    renderer.setSize(window.innerWidth,window.innerHeight);
    composer.setSize( window.innerWidth, window.innerHeight );
    const ar = window.innerWidth/window.innerHeight;

    // perspectiva
    camera.aspect = ar;
    camera.updateProjectionMatrix();

}



function esfera( radio, masa, posicion, material, material_textura ){
	this.body = new CANNON.Body( {mass: masa, material: material} );
	this.body.addShape( new CANNON.Sphere( radio ) );
	this.body.position.copy( posicion );
	this.visual = new THREE.Mesh( new THREE.SphereGeometry( radio ), material_textura);
	this.visual.position.copy( this.body.position );
}

function cubo( ancho,alto,amplio,masa, posicion, material, material_textura ){
	this.body = new CANNON.Body( {mass: masa, material: material} );
	this.body.addShape( new CANNON.Box(new CANNON.Vec3(ancho,alto,amplio)) );
	this.body.position.copy( posicion );
	this.visual = new THREE.Mesh( new THREE.BoxGeometry( ancho,alto,amplio ), material_textura);
	this.visual.position.copy( this.body.position );
}

function cilindro( rT,rB,alto,segmentos,masa, posicion, material, material_textura ){
	this.body = new CANNON.Body( {mass: masa, material: material} );
	this.body.addShape( new CANNON.Cylinder(rT,rB,alto,segmentos));
	this.body.position.copy( posicion );
	this.visual = new THREE.Mesh( new THREE.CylinderGeometry( rT,rB,alto,segmentos), material_textura);
	this.visual.position.copy( this.body.position );
}

 // 
 function panel( ancho,alto,amplio, posicion, material, material_textura ){
	this.body = new CANNON.Body( {mass: 0, material: material} );
	this.body.addShape( new CANNON.Box(new CANNON.Vec3(ancho, alto, amplio)) );
	this.body.position.copy( posicion );
	this.visual = new THREE.Mesh( new THREE.BoxGeometry(ancho, alto, amplio), material_textura);
	this.visual.position.copy( this.body.position );
}

function plano( ancho,material, material_textura){
    const planeShape = new CANNON.Plane()
    this.body = new CANNON.Body({ mass: 0,material: material})
    this.body.addShape(planeShape)
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    
    const planeGeometry = new THREE.PlaneGeometry(ancho, ancho)
    this.visual = new THREE.Mesh(planeGeometry, material_textura)
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
                    object.castShadow = true;
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
    
console.log('Modelo de Kirby cargado...')

}

function loadWorld() {
    
    // Init mundo de fisicas
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -40, 0)
    })
    //scene.add(new THREE.AxesHelper(1000));
    
    const sphereGroundContactMaterial = new CANNON.ContactMaterial(materialSuelo,materialEsfera,
        { friction: 0.7, 
            restitution: 0.9 });
    world.addContactMaterial(sphereGroundContactMaterial);



    //p.2, 0.7
    // Texturas
    const path = '../images/'
    const textureLoader = new THREE.TextureLoader()
    // const sueloTx = textureLoader.load(path + 'pisometalico_1024.jpg')
    // const sueloNormalTx = textureLoader.load(path + 'pisometalico_1024_norm.jpg')
    const sueloTx = textureLoader.load(path + 'wd_base.png')
    const sueloNormalTx = textureLoader.load(path + 'wd_base_normal.png')

    
  
    const maderaTx = textureLoader.load(path + "wood.jpg");
    const maderaNormalTx = textureLoader.load(path + "wood_norm.jpg");
    maderaNormalTx.wrapS = THREE.RepeatWrapping;
    maderaNormalTx.wrapT = THREE.RepeatWrapping;
    const cristalNormalTx = textureLoader.load(path + "glass_norm.jpeg");

    // Materiales
    const materialSueloAspecto = new THREE.MeshPhongMaterial({
        color: 'white',
        map: sueloTx,
        normalMap: sueloNormalTx,
        side: THREE.DoubleSide
    })

    const materialMesaAspecto = new THREE.MeshPhongMaterial({
        color: 'rgb( 138, 122, 118 )',
        map: sueloTx,
        normalMap: sueloNormalTx
    })

    const materialMadera = new THREE.MeshPhongMaterial({
        color: 'white',
        map: maderaTx,
        normalMap: maderaNormalTx
    })
    
    const hdrEquirect = rgbLoader.load(
      "../empty_warehouse_01_4k.hdr",
      () => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
      }
    );

    const metal_rojo = new THREE.MeshPhongMaterial({
        color: 'red',
        emissive: 0x000000,
        envMap: hdrEquirect,
    });
    
    const metal_azul = new THREE.MeshPhongMaterial({
        color: 'blue',
        emissive: 0x000000,
        envMap: hdrEquirect,
    });
    
    const metal_verde = new THREE.MeshPhongMaterial({
        color: 'green',
        emissive: 0x000000,
        envMap: hdrEquirect,
    });

    const cristal_panel = new THREE.MeshPhysicalMaterial({
        color:'aliceblue',
        transmission: options.transmission,
        thickness: options.thickness,
        roughness: options.roughness,
        envMap: hdrEquirect,
        normalMap: cristalNormalTx,
        clearcoatNormalMap: cristalNormalTx,
        clearcoat: options.clearcoat,
        clearcoatRoughness: options.clearcoatRoughness,
        normalScale: new THREE.Vector2(options.normalScale),
        clearcoatNormalScale: new THREE.Vector2(options.clearcoatNormalScale),
        side : THREE.DoubleSide
 

      });
  

      const fondo = []
      for(let i = 0;i<posNames.length;i++){
          fondo.push(new THREE.MeshBasicMaterial ({ side: THREE.BackSide,
                                                     color: 'skyblue',
                                                      map: new THREE.TextureLoader().
                                                      load(path+posNames[i])}));
      }
    

    let limit = 20 
    let altura = 10
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

    let ancho = 2
    let po = limit 
    paredMesh = new THREE.Mesh( new THREE.BoxGeometry( 40+2,altura,ancho), materialMadera);
    paredMesh.position.y = altura/2
    let paredMesh_b = paredMesh.clone()
    let paredMesh_a = paredMesh.clone()
    paredMesh_b.position.z = po

    paredMesh_a.position.z = -po

    paredMesh.rotateY(Math.PI/2);
    let paredMesh_d = paredMesh.clone()
    let paredMesh_i = paredMesh.clone()
    paredMesh_i.position.x = -po
    paredMesh_d.position.x = po
    paredes = new THREE.Object3D();
    paredes.add(paredMesh_b)
    paredes.add(paredMesh_a)
    paredes.add(paredMesh_i)
    paredes.add(paredMesh_d)
  
    // paredMesh_d.position.x = limit
    // scene.add(paredMesh_d)


    const geoHabitacion = new THREE.BoxGeometry(500,500,500);
    habitacion = new THREE.Mesh(geoHabitacion,fondo);
    scene.add(habitacion)

    // Suelo
    //cristal_laberinto = new plano( 40, materialSuelo, cristal );
    cristal_laberinto = new panel( 40,40,1, new CANNON.Vec3( 0, 0, 0 ), materialSuelo, cristal_panel );
    cristal_laberinto.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),Math.PI/2);
    world.addBody( cristal_laberinto.body );
    cristal_laberinto.body.position.y = 10
    paredes.add( cristal_laberinto.visual );

      /*
    let pared_1 = new cubo( 20,10,1,0, new CANNON.Vec3( 0, 5, 0  ), materialEsfera, materialSueloAspecto );
    world.addBody( pared_1.body );
    paredes.add( pared_1.visual );
    let pared_2 = new cubo( 20,10,1,0, new CANNON.Vec3( 0, 5, 10  ), materialEsfera, materialSueloAspecto );
    world.addBody( pared_2.body );
    paredes.add( pared_2.visual );
    */
    let cilindro_1 = new cilindro( 3, 3, 9, 32 ,0, new CANNON.Vec3( 0, 5, 0  ), materialSuelo, materialSueloAspecto );
    world.addBody( cilindro_1.body );
    paredes.add( cilindro_1.visual );
    
    scene.add(paredes)

    planoBase = new plano( 40, materialSuelo, materialSueloAspecto);
    planoBase.body.position.y = -0.01
    planoBase.visual.castShadow = false

    world.addBody( planoBase.body );
    scene.add( planoBase.visual );

    // let wrt = new plano( 60, materialSuelo, materialSueloAspecto );


   // (0, 5, 10 )
   // (-10, 5, -10)
   // (10, 5, -10 )
    
    //Esfera
    pelota_roja = new esfera( 2, 200, new CANNON.Vec3(0, 5, 10 ), materialEsfera, metal_rojo );
    pelota_roja.visual.material.color.set('red')
    world.addBody( pelota_roja.body );
    scene.add( pelota_roja.visual );

    pelota_verde = new esfera( 2, 200, new CANNON.Vec3(-10, 5, -10), materialEsfera, metal_verde );
    pelota_verde.visual.material.color.set('green')
    world.addBody( pelota_verde.body );
    scene.add( pelota_verde.visual );

    pelota_azul = new esfera( 2, 200, new CANNON.Vec3(10, 5, -10 ), materialEsfera, metal_azul );
    pelota_azul.visual.material.color.set('blue')
    world.addBody( pelota_azul.body );
    scene.add( pelota_azul.visual );

    //Pata de la mesa y mesa:
    let pata = new THREE.Mesh( new THREE.BoxGeometry( 40,250,40 ), materialMesaAspecto);
    pata.position.y= -135
    scene.add( pata );

    let base_mesa = new THREE.Mesh( new THREE.BoxGeometry( 60,2,60 ), materialMesaAspecto);
    base_mesa.receiveShadow = false
    base_mesa.position.y = -10
    base_mesa.rotateY(Math.PI/2)
    scene.add( base_mesa );





    pelotas.push(pelota_roja,pelota_azul,pelota_verde)

    kirby(2, 200, new CANNON.Vec3( 5, 6, 5 ), materialEsfera);
    //cargaHabitacion();

    //let imgElement = Jimp.read('../kirby_ball/t0011_0.png');
    //
    Jimp.read('../images/tet.png', (err, kb) => {
        if (err) throw err;
        let mat = cv.matFromImageData( kb.bitmap);
        let dst = new cv.Mat();
        cv.cvtColor(mat, dst, cv.COLOR_RGBA2GRAY)
        // info(mat)
        // info(dst)
		const circle = document.getElementById("b1");
        circle.height = window.innerHeight
		circle.style.cssText = "position:absolute; bottom:0px; width:100px; width:100px;  ";
        //cv.imshow(circle,dst)
        let cuentas = []
        for(let i = 0;i< dst.size().width;i++){
            for(let j = 0;j< dst.size().height;j++){
                let pointer = dst.ucharAt(i, j * dst.channels());
                //console.log(pointer)
                if ( pointer == 0){
                let cubito = new cubo( 1,1,1,2, new CANNON.Vec3( i, 1, j  ), materialEsfera, materialMadera );
                world.addBody( cubito.body );
                scene.add( cubito.visual );
                cubos.push(cubito)
                cuentas.push([i,j])

                
                }
            }
        }
        cargado_laberinto = true
        console.log("Cubos generados...")
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
    // ejes locales?

    let quaternion = quatX.mult(quatY).mult(quatBase);
 
    quaternion.normalize();
    planoBase.body.quaternion = quaternion;

    
    paredes.quaternion.copy(quatX.mult(quatY))
    

    for(let i = 0; i< pelotas.length;i++){
        pelotas[i].visual.position.copy( pelotas[i].body.position );
        pelotas[i].visual.quaternion.copy( pelotas[i].body.quaternion );
    }
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
    cameraControls.update();
    
    TWEEN.update();



}


function render() {

        requestAnimationFrame(render);
        if (cargando != 0 && cargado_laberinto == false){ return}// No comienza el bucle de renderizado hasta que los modelos esten cargados 
        if (borraUIInicial){
            borraUIInicial = false
            const overlay = document.getElementById( 'overlay' );
            overlay.remove();
        }

        update();
        renderer.clear();        
        composer.render();

}


