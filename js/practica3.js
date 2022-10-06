

import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.140.1/examples/jsm/controls/OrbitControls.js';
import {TWEEN} from '../lib/tween.module.min.js'
import {GUI} from '../lib/lil-gui.module.min.js'

let angulo = 0;
let scene,camera,renderer,robot;
let cameraControls;
let L=100;
let planta,alzado,perfil,cenital;
const normales = [];
const escalado = 1/4



init();
loadScene();
render();

function init() {

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0xffffff));
    renderer.autoClear = false;
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    
    const ar = window.innerWidth/window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(120, 250, 220);
    camera.lookAt(new THREE.Vector3(0, 135, 0));

    setCameras(ar);
    
    cameraControls = new OrbitControls( camera,renderer.domElement );
    cameraControls.target.set(0,135,0)
    window.addEventListener('resize', updateAspectRatio );
}

function setCameras(ar)
{
    let camaraOrto;

    // Construir las camaras ortograficas
    if(ar>1)
     camaraOrto = new THREE.OrthographicCamera(-L*ar,L*ar,L,-L,1,1000);
    else
     camaraOrto = new THREE.OrthographicCamera(-L,L,L/ar,-L/ar,1,1000);

    cenital = camaraOrto.clone();
    cenital.position.set(0,5*L,0);

    cenital.up = new THREE.Vector3(0,1,0);
    cenital.lookAt(0,0,0);
  
}

function updateAspectRatio()
{
    // Cambia las dimensiones del canvas
    renderer.setSize(window.innerWidth,window.innerHeight);

    // Nuevo relacion aspecto de la camara
    const ar = window.innerWidth/window.innerHeight;

    // perspectiva
    camera.aspect = ar;
    camera.updateProjectionMatrix();

    // ortografica
    if(ar>1){
        /* alzado.left = planta.left = perfil.left = -L*ar;
        alzado.right = planta.right =perfil.right = L*ar; */
        cenital.left = -L*ar
        cenital.right = L*ar
    }
    else{
        /* alzado.top = planta.top= perfil.top=  L/ar;
        alzado.bottom = planta.bottom = perfil.bottom = -L/ar; */
        cenital.top = L*ar
        cenital.bottom = -L*ar
               
    }
 
    /*
    alzado.updateProjectionMatrix();
    perfil.updateProjectionMatrix();
    planta.updateProjectionMatrix();
    */
    cenital.updateProjectionMatrix();
}

function loadScene() {

    //Materiales
    // const matBase = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    const matBase = new THREE.MeshNormalMaterial({wireframe: false, flatShading: false});
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
    const posicion = [
        /*
        0,5-y,38-z, //0
        2,5-y,38-z, //1
        2,15-y,38-z, //2 
        0,15-y,38-z, //3
        2,20-y,19-z, //4
        0,20-y,19-z, //5
        0,0-y,19-z, //6
        2,0-y,19-z, //7
        */
        //Delante
        0,5,19, //0 -> 0 
        2,5,19, //1 -> 1
        2,15,19, //2 -> 2
        0,15,19, //3 ->  3

        //Arriba
        0,15,19, //3 -> 4
        2,15,19, //2 -> 5
        4,20,0, //4 -> 6
        0,20,0, //5 -> 7
        
        //atras
        4,20,0, //4 -> 8
        0,20,0, //5 -> 9
        4,0,0, //7 -> 10
        0,0,0, //6 -> 11

        //abajo
        2,5,19, //1 -> 12 
        0,5,19, //0 -> 13
        0,0,0, //6 -> 14
        4,0,0, //7 ->  15

        //derecha
        2,5,19, //1 -> 16
        4,0,0, //7 -> 17
        4,20,0, //4 -> 18
        2,15,19, //2 -> 0

        //izquierda
        0,5,19, //0 ->  20
        0,15,19, //3 -> 21 
        0,20,0, //5 -> 22
        0,0,0 //6 ->  23

    ]

  
    const indices = [
        
        //delante
        0,1,2,
        2,3,0,
        //arriba
        4,5,6,
        6,7,4,
        //atras
        8,10,11,
        11,9,8,
        //abajo
        12,13,14,
        14,15,12,
        //derecha
        //17,18,19,
        //19,16,17,
        16,17,18,
        18,19,16,
        //izquierda
        20,21,22,
        22,23,20

    ]
    geometriaDedoPinza.setIndex( indices );
    geometriaDedoPinza.setAttribute( 'position', new THREE.Float32BufferAttribute(posicion,3));
    const bufferPosition = geometriaDedoPinza.getAttribute('position');
    const pv = [] // Position vectorised
     
    for(let i = 0;i<posicion.length/3;i++){
        const v1 = new THREE.Vector3( );
        v1.fromBufferAttribute(bufferPosition,i)
        pv.push(v1)
    }

    var norm = (x,y,i) =>
    {
        const normal = new THREE.Vector3();
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        a.subVectors ( x, i )
        b.subVectors ( y ,i )
        //a.normalize()
        //b.normalize()
        normal.crossVectors(a,b)
        normal.normalize()
        normales.push(normal.x,normal.y,normal.z)
        //console.log(normal)
    }

    norm(pv[1],pv[3], pv[0]);   norm(pv[2],pv[0], pv[1]);    norm(pv[3],pv[1], pv[2]);   norm(pv[0],pv[2], pv[3]);//delante
    norm(pv[5],pv[7], pv[4]);    norm(pv[6],pv[4], pv[5]);   norm(pv[7],pv[4], pv[6]);    norm(pv[4],pv[6], pv[7]); //arriba
    norm(pv[4],pv[6], pv[5]);    norm(pv[7],pv[5], pv[4]);   norm(pv[6],pv[4], pv[7]);    norm(pv[5],pv[7], pv[6]); //atras mal
    norm(pv[13],pv[15], pv[12]);    norm(pv[14],pv[12], pv[13]);   norm(pv[15],pv[13], pv[14]);    norm(pv[12],pv[14], pv[15]); //abajo 
    norm(pv[17],pv[19], pv[16]);    norm(pv[18],pv[16], pv[17]);   norm(pv[19],pv[17], pv[18]);    norm(pv[16],pv[18], pv[19]); //derecha
    norm(pv[21],pv[23], pv[20]);    norm(pv[22],pv[20], pv[21]);   norm(pv[23],pv[21], pv[22]);    norm(pv[20],pv[22], pv[23]); //izquierda
    
    
    geometriaDedoPinza.setAttribute( 'normal', new THREE.Float32BufferAttribute(normales,3));
    console.log(normales)

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

    pinzaDedoI.position.set(-10.5, 10, 18);
    
    pinzaDedoD.position.set(-10, -10, 16);

    pinzaBaseI.position.set(0, 8, 6);
    pinzaBaseD.position.set(0, -8, 6);


        /*
        scene.attach( child ); // detach from parent and add to scene

        child.position.set( x, y, z );

        parent.attach( child );
        */

    const suelo = new THREE.Mesh(geometriaSuelo, matBase)
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
    renderer.clear();
    const ar = window.innerWidth/window.innerHeight;
    
    if (ar > 1){
        renderer.setViewport(0,window.innerHeight * 3/4,window.innerHeight *1/4,window.innerHeight *1/4);
    }
    else{
        renderer.setViewport(0,window.innerHeight - window.innerWidth/4,window.innerWidth/4, window.innerWidth/4);
    }
    
    renderer.render(scene, cenital);
    //Abajo derecha
    renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
    renderer.render(scene, camera);
    
}

function update() {
    angulo += 0.00;
    robot.rotation.y = angulo;
}

