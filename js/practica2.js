

import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.140.1/examples/jsm/controls/OrbitControls.js';


let angulo = 0;
let scene,camera,renderer,robot;

init();
loadScene();
render();

function init() {

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0xffffff));
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(120, 250, 220);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    const controls = new OrbitControls( camera,renderer.domElement );
}

function loadScene() {

    //Materiales
    const matBase = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

    //Geometrias
    const geometriaSuelo = new THREE.PlaneGeometry(1000, 1000, 20, 20)
    const geometriaBase = new THREE.CylinderGeometry(50, 50, 15, 30);

    const geometriaEje = new THREE.CylinderGeometry(20, 20, 18, 30);
    const geometriaEsparrago = new THREE.BoxGeometry(18, 120, 12);
    const geometriaRotula = new THREE.SphereGeometry(20, 20, 10);

    const geometriaDisco = new THREE.CylinderGeometry(22, 22, 6, 30);
    const geometriaNervio = new THREE.BoxGeometry(4, 80, 4);

    const geometriaMano = new THREE.CylinderGeometry(15, 15, 40, 30);

    const geometriaPinzaParalepipedo = new THREE.BoxGeometry(4, 20, 19);
    const geometriaDedoPinza = new THREE.BufferGeometry();

    // Variables de ajuste de posicion
    const z = 10;
    const y = 10;
    const posicion = [

        0,5-y,38-z, //0
        2,5-y,38-z, //1
        2,15-y,38-z, //2 
        0,15-y,38-z, //3
        2,20-y,19-z, //4
        0,20-y,19-z, //5
        0,0-y,19-z, //6
        2,0-y,19-z //7

    ]
  
    const indices = [
        
        //delante
        0,1,2,
        2,3,0,
        //arriba
        3,2,4,
        4,5,4,
        //atras
        4,5,6,
        6,7,4,
        //abajo
        0,6,7,
        7,1,0,
        //derecha
        2,4,7,
        7,1,2,
        //izquierda
        //0,3,5,
        //5,6,0
        3,5,6,
        6,0,3

    ]

    var normales = [ // 24 x3
    0,0,1, 0,0,1, 0,0,1, 0,0,1,      // Front
    1,0,0, 1,0,0, 1,0,0, 1,0,0,      // Right
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,  // Back 
    -1,0,0, -1,0,0, -1,0,0, -1,0,0,  // Left
    0,1,0, 0,1,0, 0,1,0, 0,1,0,      // Top 
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0   // Bottom
    ];

    geometriaDedoPinza.setIndex( indices );
    geometriaDedoPinza.setAttribute( 'position', new THREE.Float32BufferAttribute(posicion,3));
    geometriaDedoPinza.setAttribute( 'normal', new THREE.Float32BufferAttribute(normales,3));

    //Meshes
    robot = new THREE.Object3D();
    const base = new THREE.Mesh(geometriaBase, matBase);
    base.position.set(0, 0, 0);

    const brazo = new THREE.Object3D();
    
    const eje = new THREE.Mesh(geometriaEje, matBase)
    eje.rotateZ(Math.PI / 2);

    const esparrago = new THREE.Mesh(geometriaEsparrago, matBase)
    esparrago.rotateY(Math.PI / 2);
    esparrago.position.set(0, 50, 0);
   
    const rotula = new THREE.Mesh(geometriaRotula, matBase)
    rotula.position.set(0, 120, 0);
    
    const antebrazo = new THREE.Object3D();
    antebrazo.position.set(0, 120, 0);
  
    const disco = new THREE.Mesh(geometriaDisco, matBase);

    const nervios = new THREE.Object3D(); 

    const nervio1 = new THREE.Mesh(geometriaNervio, matBase);
    nervio1.position.set(8, 34, -4);

    const nervio2 = new THREE.Mesh(geometriaNervio, matBase);
    nervio2.position.set(-8, 34, -4);

    const nervio3 = new THREE.Mesh(geometriaNervio, matBase);
    nervio3.position.set(8, 34, 4);

    const nervio4 = new THREE.Mesh(geometriaNervio, matBase);
    nervio4.position.set(-8, 34, 4);
  

    const mano = new THREE.Mesh(geometriaMano, matBase)


    mano.rotateZ(Math.PI / 2);
    mano.position.set(0, 70, 0);
    

    const pinzaI = new THREE.Object3D(); 
    const pinzaD = new THREE.Object3D().copy(pinzaI);
    const pinzaBaseI = new THREE.Mesh(geometriaPinzaParalepipedo, matBase)
    const pinzaBaseD = new THREE.Mesh(geometriaPinzaParalepipedo, matBase)

    const pinzaDedoI = new THREE.Mesh(geometriaDedoPinza, matBase);
    const pinzaDedoD = new THREE.Mesh(geometriaDedoPinza, matBase);

    
    pinzaBaseI.rotateY(Math.PI / 2);
    pinzaBaseD.rotateY(Math.PI / 2);

    pinzaBaseI.rotateZ(-Math.PI / 2);
    pinzaBaseD.rotateZ(-Math.PI / 2);

    pinzaDedoI.rotateZ(-Math.PI / 2);
    pinzaDedoD.rotateZ(-Math.PI / 2);

    pinzaD.position.set(0, 8, 6);
    pinzaI.position.set(0, -8, 6);
    const suelo = new THREE.Mesh(geometriaSuelo, new THREE.MeshBasicMaterial({ color: 'red', wireframe: true }))
    suelo.rotateX(-Math.PI / 2);
    

    //Grafo: Desde la raíz

    scene.add(new THREE.AxesHelper(1000));

    scene.add(robot);
    robot.add(base);
    base.add(brazo);

    brazo.add(eje);
    brazo.add(esparrago);
    brazo.add(rotula);
    brazo.add(antebrazo);

        nervios.add(nervio1);
        nervios.add(nervio2);
        nervios.add(nervio3);
        nervios.add(nervio4);

    antebrazo.add(nervios);
    antebrazo.add(disco);
    antebrazo.add(mano);

    mano.add(pinzaI);
    mano.add(pinzaD);

    pinzaI.add(pinzaBaseI);
    pinzaD.add(pinzaBaseD);
    pinzaI.add(pinzaDedoI);
    pinzaD.add(pinzaDedoD);

    scene.add(suelo);

}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}
function update() {
    angulo += 0.01;
    robot.rotation.y = angulo;
}