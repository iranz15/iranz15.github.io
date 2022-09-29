

import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.140.1/examples/jsm/controls/OrbitControls.js';


let angulo = 0;
let scene,camera,renderer,robot,cameraHud;
let cameraControls;
let L=5;
let planta,alzado,perfil;

init();
loadScene();
render();

function init() {

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0xffffff));
    document.getElementById('container').appendChild(renderer.domElement);
    renderer.autoClear = false;
    
    scene = new THREE.Scene();
    // Si hay backgroudn no va
    
    const ar = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, ar, 0.1, 1000);
    //cameraHud = new THREE.OrthographicCamera(-2*ar,2*ar,2,-2,1,1000)
    
    setCameras(ar);
    
    camera.position.set(120, 250, 220);
    camera.lookAt(new THREE.Vector3(0, 1, 0));
    cameraControls = new OrbitControls( camera,renderer.domElement );
    cameraControls.target.set(0,1,0)
    
    // Captura eventos
    window.addEventListener('resize',updateAspectRatio);
    //renderer.domElement.addEventListener('dblclick',rotateShape);

}

/*
function rorateSHape(evento){
    //Atentcuon al pickfing
}
*/
function setCameras(ar){
 
    let camaraOrtografica;
    
    if (ar > 1) {
        camaraOrtografica = new THREE.OrthographicCamera( -L*ar, L*ar, L, -L, -10, 100);
    }
    else{
        camaraOrtografica = new THREE.OrthographicCamera( -L, L, L/ar, -L/ar, -10, 100);  
    }
    
    alzado = camaraOrtografica.clone();
    alzado.position.set(0,0,L);
    alzado.lookAt(0,0,0);
    
    //planta
    planta = camaraOrtografica.clone();
    planta.position.set(0,L,0);
    planta.lookAt(0,0,0);
    planta.up = new THREE.Vector3(0,0,-1)
    
    //perfil
    perfil = camaraOrtografica.clone();
    perfil.position.set(L,0,0);
    perfil.lookAt(0,0,0);
    //perfil.up = new THREE.Vector3(0,0,-1)
}

function updateAspectRatio(){
    renderer.setSize(window.innerWidth,window.innerHeight)
    const ar = window.innerWidth / window.innerHeight;
    camera.aspect = ar;

    
    // Actualiza la vista de Orto
    if (ar>1){
        alzado.left = planta.left = perfil.left = -L*ar;
        alzado.right = planta.right = perfil.right = L*ar;
        alzado.top = planta.top = perfil.top = L;
        alzado.bottom = planta.bottom = perfil.bottom = -L;
        
    }else{
        alzado.left = planta.left = perfil.left = -L;
        alzado.right = planta.right = perfil.right = L;
        alzado.top = planta.top = perfil.top = L/ar;
        alzado.bottom = planta.bottom = perfil.bottom = -L/ar;
        
    }
    alzado.updateProjectionMatrix();
    planta.updateProjectionMatrix();
    perfil.updateProjectionMatrix();
    camera.updateProjectionMatrix();
    // cameraHud.left = -2 * ar
    // cameraHud.right = 2 * ar
    

}

function calculaNormales(normales){
    for(let i = 0; i<normales.length();i++){
        break
    }
}
    
function loadScene() {

    //Materiales
    // const matBase = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
    const matBase = new THREE.MeshNormalMaterial();

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
    // *3
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

    var normales = [ // 24 
    0,0,1, 0,0,1, 0,0,1, 0,0,1,      // Front
    0,1,0, 0,1,0, 0,1,0, 0,1,0,      // Top 
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,  // Back 
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,   // Bottom
    1,0,0, 1,0,0, 1,0,0, 1,0,0,      // Right
    -1,0,0, -1,0,0, -1,0,0, -1,0,0  // Left
    ];
    

    geometriaDedoPinza.setIndex( indices );
    geometriaDedoPinza.setAttribute( 'position', new THREE.Float32BufferAttribute(posicion,3));
    geometriaDedoPinza.setAttribute( 'normal', new THREE.Float32BufferAttribute(normales,3));
    var normal = geometriaDedoPinza.getAttribute('normal');
    var position = geometriaDedoPinza.getAttribute('position');
    
    /*
    var origin = new THREE.Vector3(position.array[0], position.array[1], position.array[2]);
    var dir = new THREE.Vector3(normal.array[0], normal.array[1], normal.array[2])
    var helper = new THREE.ArrowHelper(dir, origin, 1, 0x00ff00);
    helper.position.copy(origin);
    scene.add(helper);
    */
    
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
    const suelo = new THREE.Mesh(geometriaSuelo, new THREE.MeshNormalMaterial())
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
    
    //Borar una unica vez
    renderer.clear();
    // Repartir el canvas en cuatro viewports con la misma relacion de aspecto
    // Origen es bottom left
    
    //Abajo Izquiera
    renderer.setViewport(0,0,window.innerWidth/2,window.innerHeight/2);
    renderer.render(scene, planta);
    
    // Arriba Izquierda
    renderer.setViewport(0,window.innerHeight/2,window.innerWidth/2,window.innerHeight/2);
    renderer.render(scene, alzado);
    
    // Arriba Derecha
    renderer.setViewport(window.innerWidth/2,window.innerHeight/2,window.innerWidth/2,window.innerHeight/2);
    renderer.render(scene, perfil);
    
    //Abajo derecha
    renderer.setViewport(window.innerWidth/2,0,window.innerWidth/2,window.innerHeight/2);
    renderer.render(scene, camera);
    
}
function update() {
    angulo += 0.01;
    robot.rotation.y = angulo;
}
