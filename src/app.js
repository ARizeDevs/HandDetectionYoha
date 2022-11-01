import './scss/app.scss';

/* Your JS Code goes here */

/* Demo JS */
import './demo.js';
import * as THREE from 'three';


import * as yoha from '@handtracking.io/yoha';
import { SetCursorColor, SetCursorPosition, SetCursorVisibility, InitializeCursor } from './cursor';
import dist from 'webpack-merge';
import { Vector3 } from 'three';

async function Run() {
  // Download models.
  const modelFiles = await yoha.DownloadMultipleYohaTfjsModelBlobs(
    '/box/model.json', 
    '/lan/model.json', 
    (rec, total) => {
      console.log('Download progress: ' + (rec / total) * 100 + '%');
    });

  // const model = await handpose.load();

  // Setup video feed.
  const streamRes = await yoha.CreateMaxFpsMaxResStream();
  if (streamRes.error) { 
    // Non-production ready error handling...
    console.error(streamRes.error); 
    return ;
  }
  const video = yoha.CreateVideoElementFromStream(streamRes.stream);
  video.id = "videoInput";

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user'
      // Only setting the video to a specified size in order to accommodate a
      // point cloud, so on mobile devices accept the default size.
    },
  });
  // const video = document.getElementById('videoInput')
  // video.srcObject = stream;
  // // const predictions = await model.estimateHands(document.querySelector("#videoInput"));
  // video.addEventListener('loadeddata', animate)

  document.body.appendChild(video);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, video.width / video.height, 0.001, 1000);
  // const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);

  camera.position.z = 2;


  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setClearColor(0x000000, 0); // the default
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const geometry1 = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material1 = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
  const box = new THREE.Mesh(geometry1, material1);
  scene.add(box);


  const spheres = [];

  for (let i = 0; i < 21; i++) {
    const geometry = new THREE.SphereGeometry(0.025, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.visible = true;
    scene.add(sphere);
    spheres.push(sphere);
  }

    const geometry = new THREE.TorusGeometry( 0.12, 0.01, 16, 100 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const torus = new THREE.Mesh( geometry, material );
    scene.add( torus );


  // async function animate() {
  //   const predictions = await model.estimateHands(document.querySelector('#videoInput'));

  //   if (predictions.length > 0) {

  //     // console.log("there is a hand here");

  //     for (let i = 0; i < predictions.length; i++) {
  //       const keypoints = predictions[i].landmarks;

  //       // Log hand keypoints.
  //       // for (let i = 0; i < keypoints.length; i++) {
  //       //   const [x, y, z] = keypoints[i];




  //       // }

  //       spheres.forEach((sphere, i) => {
  //         const [x, y, z] = keypoints[i];

  //         let vec = new THREE.Vector3();
  //         let pos = new THREE.Vector3();

  //         // vec.set(
  //         //     (x /100) * 2 - 1,
  //         //     (-y /100) * 2 + 1,
  //         //     0.5);

  //         vec.set(
  //           (x / 1000) * 2 - 1,
  //           (-y / 1000) * 2 + 1,
  //           z/1000);

  //         console.log(vec);

  //         vec.unproject(camera);
  //         vec.sub(camera.position).normalize();
  //         let distance = -camera.position.z / vec.z;
  //         pos.copy(camera.position).add(vec.multiplyScalar(distance));
  //         sphere.position.x = pos.x;
  //         sphere.position.y = pos.y;
  //         sphere.position.z = 0;

  //         // const scale = ((distance) - 2) / 20 ;
  //         // sphere.position.z = scale;
  //         // console.log(scale);
  //         // console.log(scale);
  //       });

  //     }
  //   }
  //   requestAnimationFrame(animate);
  //   renderer.render(scene, camera);

  // }


  // Note the 'wasmPath' argument. This has to be in sync with how you serve the respective
  // files. See webpack.config.js for an example.
  const wasmConfig = {
    // wasmPaths: './node_modules/@tensorflow/tfjs-backend-wasm/dist/'
    wasmPaths: './node_modules/@tensorflow/tfjs-backend-wasm/dist/'
  };

   const thresholds = yoha.RecommendedHandPoseProbabilityThresholds;

  // Run engine.
  // We configure small padding to avoid that users move their hand outside webcam view
  // when trying to move the cursor towards the border of the viewport.
  yoha.StartTfjsWasmEngine({}, wasmConfig, video, modelFiles, res => {
    if (res.isHandPresentProb > 0.5) {

      var whichHand = '';

      if(res.isLeftHandProb > 0.7){
        whichHand = 'left';
      } else if(res.isLeftHandProb < 0.3){
        whichHand = 'right';
      }

      // console.log(res.isLeftHandProb);


      var vecDistance = spheres[20].position.distanceTo(spheres[4].position);

      if(whichHand === 'right' && res.coordinates[16][0] > res.coordinates[4][0]){
        // console.log("Back");
      } else if(whichHand === 'right' && res.coordinates[16][0] < res.coordinates[4][0]){
        // console.log("Front");
      }
      // Static rotation 
      var vecSub = new THREE.Vector3(); 
      vecSub.subVectors(spheres[20].position, spheres[4].position);

      var mx = new THREE.Matrix4().lookAt(spheres[20].position,spheres[9].position,new THREE.Vector3(0,1,0));
      var qt = new THREE.Quaternion().setFromRotationMatrix(mx);

      spheres.forEach((sphere, i) => {
        const [ x, y] = res.coordinates[i];

          let vec = new THREE.Vector3();
          let pos = new THREE.Vector3();

          vec.set(x * 2 - 1, -y * 2 + 1, 0.5);
          vec.unproject(camera);
          vec.sub(camera.position).normalize();
          let distance = -camera.position.z / vec.z;
          pos.copy(camera.position).add(vec.multiplyScalar(distance));
          sphere.position.x = -pos.x;
          sphere.position.y = pos.y;

          if(i == 20 ){

            var screenRatio = null;
            var newScale = null;
            if(video.width > video.height){ // landscape
              screenRatio = video.width/video.height;
            } else {
              screenRatio = video.height/video.width;
            }

            newScale = vecDistance * screenRatio;

            box.scale.set(newScale , newScale, newScale);

            box.position.x = -pos.x;
            box.position.y = pos.y;
            box.quaternion.copy(qt);


            // var yDiff = spheres[9].position.y - spheres[20].position.y;
            // var xDiff = spheres[9].position.x - spheres[20].position.x;

            // var angle = (Math.atan2(yDiff,xDiff) * 180.0/Math.PI);
            // var angle2 = new THREE.Euler(0,0,angle);
            // box.setRotationFromEuler(angle2);


            var rotationVec = new THREE.Vector3
            rotationVec.subVectors(spheres[4].position, spheres[16].position);
            console.log(rotationVec.x);
            // var _xRotationDegree = map(rotationVec.x,[-1,1],[0,90]);
            // console.log(_xRotationDegree);
            box.rotation.z += (rotationVec.x) * screenRatio;
            box.rotation.z += (rotationVec.y) * screenRatio;

          }

          if(i == 16){
            torus.position.x = -pos.x;
            torus.position.y = pos.y;
          }


          sphere.visible = true;
        });

        renderer.render(scene, camera);
        return;
      }

      if (res.poses.fistProb > thresholds.FIST) {
        //  do something with FIST
      } else if (res.poses.pinchProb > thresholds.PINCH) {
        //  do something with Pinch
      } 
  });

  function map (value, oldRange, newRange) {
    var newValue = (value - oldRange[0]) * (newRange[1] - newRange[0]) / (oldRange[1] - oldRange[0]) + newRange[0];
    return Math.min(Math.max(newValue, newRange[0]) , newRange[1]);
  }

}

Run();

