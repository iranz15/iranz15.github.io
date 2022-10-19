

import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.140.1/examples/jsm/controls/OrbitControls.js';
import {TWEEN} from '../lib/tween.module.min.js'
import {GUI} from '../lib/lil-gui.module.min.js'

let angulo = 0;
let scene,camera,renderer,robot;
let cameraControls, animationController;
let brazo,antebrazo,pinzas,pinzaMeshI,pinzaMeshD,gui;
let separadorPinzas = 8;
let matBase;
let L=100;
let planta,alzado,perfil,cenital;
let gb;
const normales = [];

init();
loadScene();
setupGUI();
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
    
    camaraOrto = new THREE.OrthographicCamera(-L/2,L/2,L/2,-L/2,1,1000);

    cenital = camaraOrto.clone();
    cenital.position.set(0,L+200,0);

    cenital.up = new THREE.Vector3(0,-1,0);
    cenital.lookAt(0,0,0);
  
}

function updateAspectRatio()
{
    renderer.setSize(window.innerWidth,window.innerHeight);
    const ar = window.innerWidth/window.innerHeight;

    // perspectiva
    camera.aspect = ar;
    camera.updateProjectionMatrix();

    // ortografica
    cenital.updateProjectionMatrix();
}


function loadScene() {

    //Materiales
    // const matBase = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    matBase = new THREE.MeshNormalMaterial({wireframe: false, flatShading: true});
    //Geometrias
    const geometriaSuelo = new THREE.PlaneGeometry(1000, 1000, 20, 20)
    const geometriaBase = new THREE.CylinderGeometry(50, 50, 15, 30);

    const geometriaEje = new THREE.CylinderGeometry(20, 20, 18, 30);
    const geometriaEsparrago = new THREE.BoxGeometry(18, 120, 12);
    const geometriaRotula = new THREE.SphereGeometry(20, 20, 10);

    const geometriaDisco = new THREE.CylinderGeometry(22, 22, 6, 30);
    const geometriaNervio = new THREE.BoxGeometry(4, 80, 4);

    const geometriaMano = new THREE.CylinderGeometry(15, 15, 40, 30);

    const geometriaPinza = new THREE.BufferGeometry();

    // Variables de ajuste de posicion
    const posicion = [

        //Delante
        0,5,38, //0 -> 0 
        2,5,38, //1 -> 1
        2,15,38, //2 -> 2
        0,15,38, //3 ->  3

        //Arriba
        0,15,38, //3 -> 4
        2,15,38, //2 -> 5
        4,20,19, //4 -> 6
        0,20,19, //5 -> 7
        
        //atras/para_delante
        4,20,19, //4 -> 8
        0,20,19, //5 -> 9
        4,0,19, //7 -> 10
        0,0,19, //6 -> 11

        //abajo
        2,5,38, //1 -> 12 
        0,5,38, //0 -> 13
        0,0,19, //6 -> 14
        4,0,19, //7 ->  15

        //derecha
        2,5,38, //1 -> 16
        4,0,19, //7 -> 17
        4,20,19, //4 -> 18
        2,15,38, //2 -> 19

        //izquierda
        0,5,38, //0 ->  20
        0,15,38, //3 -> 21 
        0,20,19, //5 -> 22
        0,0,19, //6 ->  23

        //para arriba
        0,20,19, //5 -> 24
        4,20,19, //4 -> 25
        4,20,0, //8 -> 26
        0,20,0, //9 -> 27

        //para abajo
        0,0,19, //6 ->  28
        4,0,19, //7 -> 29
        4,0,0, //10 -> 30
        0,0,0, //11 -> 31

        //para derecha
        4,20,19, //4 -> 32
        4,0,19, //7 -> 33
        4,20,0, //8 -> 34
        4,0,0, //10 -> 35        

        //para izqueirda
        0,20,19, //5 -> 36
        0,0,19, //6 ->  37
        0,20,0, //9 -> 38
        0,0,0 //11 -> 39
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
        22,23,20,
        
        //para arriba
        24,25,26,
        26,27,24,
        //para abajo
        28,31,30,
        30,29,28,
        //para derecha
        33,35,34,
        34,32,33,
        //para izquierda
        37,36,38,
        38,39,37

    ]
    geometriaPinza.setIndex( indices );
    geometriaPinza.setAttribute( 'position', new THREE.Float32BufferAttribute(posicion,3));
    const bufferPosition = geometriaPinza.getAttribute('position');
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
    norm(pv[25],pv[27], pv[24]);    norm(pv[26],pv[24], pv[25]);   norm(pv[27],pv[25], pv[26]);    norm(pv[24],pv[26], pv[27]);//para arriba
    norm(pv[31],pv[29], pv[28]);    norm(pv[28],pv[30], pv[29]);   norm(pv[29],pv[31], pv[30]);    norm(pv[30],pv[28], pv[31]); //para abajo 
    norm(pv[33],pv[34], pv[32]);    norm(pv[35],pv[32], pv[33]);   norm(pv[32],pv[35], pv[34]);    norm(pv[34],pv[33], pv[35]); // para derecha
    norm(pv[38],pv[37], pv[36]);    norm(pv[36],pv[39], pv[37]);   norm(pv[39],pv[36], pv[38]);    norm(pv[37],pv[38], pv[39]); //para izquierda
    
    
    geometriaPinza.setAttribute( 'normal', new THREE.Float32BufferAttribute(normales,3));
    console.log(normales)

    //Meshes
    robot = new THREE.Object3D();
    const base = new THREE.Mesh(geometriaBase, matBase);
    base.position.set(0, 0, 0);

    brazo = new THREE.Object3D();
    
    const eje = new THREE.Mesh(geometriaEje, matBase)
    eje.rotateZ(Math.PI / 2);

    const esparrago = new THREE.Mesh(geometriaEsparrago, matBase)
    esparrago.rotateY(Math.PI / 2);
    esparrago.position.set(0, 50, 0);
   
    const rotula = new THREE.Mesh(geometriaRotula, matBase)
    rotula.position.set(0, 120, 0);
    
    antebrazo = new THREE.Object3D();
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
    
    pinzas = new THREE.Object3D(); 
    const pinzaI = new THREE.Object3D(); 
    const pinzaD = new THREE.Object3D().copy(pinzaI);

    pinzaMeshI = new THREE.Mesh(geometriaPinza, matBase);
    pinzaMeshD = new THREE.Mesh(geometriaPinza, matBase);

    pinzaI.add(pinzaMeshD);
    pinzaD.add(pinzaMeshI);

    const myAxis = new THREE.Vector3(0, 0, 1);
    pinzaMeshI.rotateZ(Math.PI/2);
    pinzaMeshD.rotateZ(-Math.PI/2);
    pinzaMeshI.position.set(10, 8 , 0);
    pinzaMeshD.position.set(-10, -8, 0);

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

    mano.add(pinzas)
    pinzas.add(pinzaI);
    pinzas.add(pinzaD);



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

function setupGUI()
{
	// Definicion de los controles
	animationController = {
		mensaje: 'Controles de animación brazo robótico',
		giroBase: 0.0,
        giroBrazoEje: 0.0,
        giroAntebrazoY: 0.0,
        giroAntebrazoX: 0.0,
        giroPinzas: 0.0,
        distanciaPinzas: 8.0,
        wireframe: false,
        animacion: function() { 
                const keyframe1=  new TWEEN.Tween( animationController).
                to( {giroBase:40,
                    giroBrazoEje:45,
                    giroAntebrazoX:60,
                    giroPinzas:100
                } ,3000 ).
                interpolation( TWEEN.Interpolation.Bezier ).
                easing( TWEEN.Easing.Quadratic.InOut )
            
                const keyframe2=  new TWEEN.Tween( animationController).
                to( {distanciaPinzas:[0,10],
                    giroAntebrazoY:[-20,20,0],
                    giroPinzas:70
                } ,2500 ).
                interpolation( TWEEN.Interpolation.Linear ).
                easing( TWEEN.Easing.Quintic.InOut )
                
                const keyframe3=  new TWEEN.Tween( animationController).
                to( {giroBase:0,
                    giroBrazoEje:0,
                    giroAntebrazoX:0,
                    giroPinzas:0
                } ,3000 ).
                interpolation( TWEEN.Interpolation.Bezier ).
                easing( TWEEN.Easing.Quadratic.InOut )
                keyframe2.chain(keyframe3)
                keyframe1.chain(keyframe2)
                
                keyframe1.start();


        }

	};

	// Creacion interfaz
	gui = new GUI( {title: 'Controls Robot'} );
    gui.add(animationController, "giroBase", -180,180)
    .name("Giro Base")
    .listen()

    gui.add(animationController, "giroBrazoEje", -45,45)
    .name("Giro Brazo")
    .listen()
      
    gui.add(animationController, "giroAntebrazoY", -180,180)
    .name("Giro AnteBrazo Y ")
    .listen()

    gui.add(animationController, "giroAntebrazoX", -90,90)
    .name("Giro AnteBrazo X ")
    .listen()

    gui.add(animationController, "giroPinzas", -40,220)
    .name("Giro Pinza ")
    .listen()

    gui.add(animationController, "distanciaPinzas", 0,15)
    .name("Distancia pinzas ")
    .listen()

    gui.add( animationController, 'wireframe' )
    .name("Alambre")
    .listen()
    .onChange(w =>{
        if(matBase.wireframe) matBase.wireframe = false;
        else matBase.wireframe = true;    
    })

    gui.add( animationController, 'animacion' )
    .name("Animacion").listen() 

}

function update() {
    // En comparación al ejemplo de poliformat,
    // debido a como se han declarado las dimensiones de la escena,
    // en los controles los giros sobre el eje Z se han tranformado en giros sobre X

    // Si se utiliza la fucnion onChange de los controladores para ejecutar las animaciones,
    // no se actualiza adecuadamene el GUI al utilizar los interpoladores de TWEEN.

    robot.rotation.y = animationController.giroBase * Math.PI/180
    brazo.rotation.x = animationController.giroBrazoEje * Math.PI/180
    antebrazo.rotation.y = animationController.giroAntebrazoY * Math.PI/180
    antebrazo.rotation.x = animationController.giroAntebrazoX * Math.PI/180
    pinzas.rotation.y = animationController.giroPinzas * Math.PI/180
    pinzaMeshI.position.y = animationController.distanciaPinzas
    pinzaMeshD.position.y = -animationController.distanciaPinzas

    TWEEN.update();
    
    

}

