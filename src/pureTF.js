import './scss/app.scss';

/* Your JS Code goes here */

/* Demo JS */
import './demo.js';
import * as THREE from 'three';


// import * as yoha from '@handtracking.io/yoha';
// import { SetCursorColor, SetCursorPosition, SetCursorVisibility, InitializeCursor } from './cursor';
// import dist from 'webpack-merge';

async function Run() {
  // Download models.
//   const modelFiles = await yoha.DownloadMultipleYohaTfjsModelBlobs(
//     '/box/model.json', 
//     '/lan/model.json', 
//     (rec, total) => {
//       console.log('Download progress: ' + (rec / total) * 100 + '%');
//     });
console.log(handPoseDetection.SupportedModels);
const model = handPoseDetection.SupportedModels.MediaPipeHands;
const detectorConfig = {
  runtime: 'tfjs', // or 'tfjs'
  modelType: 'lite',
  maxNumHanbds: '1'
};
detector = await handPoseDetection.createDetector(model, detectorConfig);

  // Setup video feed.
//   const streamRes = await yoha.CreateMaxFpsMaxResStream();
//   if (streamRes.error) { 
//     // Non-production ready error handling...
//     console.error(streamRes.error); 
//     return ;
//   }
//   const video = yoha.CreateVideoElementFromStream(streamRes.stream);
//   video.id = "videoInput";

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user'
      // Only setting the video to a specified size in order to accommodate a
      // point cloud, so on mobile devices accept the default size.
    },
  });
  const video = document.getElementById('videoInput')
  video.srcObject = stream;
  // const predictions = await model.estimateHands(document.querySelector("#videoInput"));
  video.addEventListener('loadeddata', animate)

  // document.body.appendChild(video);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, video.width / video.height, 0.001, 1000);
  // const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);

  camera.position.z = 2;


  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setClearColor(0x000000, 0); // the default
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  // const box = new THREE.Mesh(geometry, material);
  // scene.add(box);


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


  async function animate() {
  const predictions = await detector.estimateHands(document.querySelector('#videoInput'));

    if (predictions.length > 0) {

      // console.log("there is a hand here");

      for (let i = 0; i < predictions.length; i++) {
        const keypoints = predictions[i].landmarks;

        // Log hand keypoints.
        // for (let i = 0; i < keypoints.length; i++) {
        //   const [x, y, z] = keypoints[i];

        // }

        spheres.forEach((sphere, i) => {
          const [x, y, z] = keypoints[i];

          let vec = new THREE.Vector3();
          let pos = new THREE.Vector3();

          // vec.set(
          //     (x /100) * 2 - 1,
          //     (-y /100) * 2 + 1,
          //     0.5);

          vec.set(
            (x / 1000) * 2 - 1,
            (-y / 1000) * 2 + 1,
            z/1000);



          vec.unproject(camera);
          vec.sub(camera.position).normalize();
          let distance = -camera.position.z / vec.z;
          pos.copy(camera.position).add(vec.multiplyScalar(distance));
          sphere.position.x = pos.x;
          sphere.position.y = pos.y;
          sphere.position.z = 0;

          if(i == 0){
            console.log('The z Value : ' + z * 1000);
            torus.position.x = pos.x;
            torus.position.y = pos.y;
            // torus.position.z = scale;
        }

          // const scale = ((distance) - 2) / 20 ;
          // sphere.position.z = scale;
          // console.log(scale);
          // console.log(scale);
        });

      }
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

  }


  // Note the 'wasmPath' argument. This has to be in sync with how you serve the respective
  // files. See webpack.config.js for an example.
//   const wasmConfig = {
//     // wasmPaths: './node_modules/@tensorflow/tfjs-backend-wasm/dist/'
//     wasmPaths: './node_modules/@tensorflow/tfjs-backend-wasm/dist/'
//   };

//    const thresholds = yoha.RecommendedHandPoseProbabilityThresholds;

  // Run engine.
  // We configure small padding to avoid that users move their hand outside webcam view
  // when trying to move the cursor towards the border of the viewport.
//   yoha.StartTfjsWasmEngine({}, wasmConfig, video, modelFiles, res => {
//     if (res.isHandPresentProb > 0.5) {
//       // SetCursorVisibility(false);
//       // console.log(res);
//       // console.log(res);

//       spheres.forEach((sphere, i) => {
//       const [ x, y] = res.coordinates[i];

//         let vec = new THREE.Vector3();
//         let pos = new THREE.Vector3();

//         vec.set(
//             x * 2 - 1,
//             -y * 2 + 1,
//             0.5);
//         vec.unproject(camera);
//         vec.sub(camera.position).normalize();
//         let distance = -camera.position.z / vec.z;
//         pos.copy(camera.position).add(vec.multiplyScalar(distance));
//         sphere.position.x = -pos.x;
//         sphere.position.y = pos.y;
//         // sphere.position.z = ;

//         const scale = ((distance) - 2) / 20 ;
//         sphere.position.z = scale;
//         // console.log(scale);
//         // console.log(scale);

//         if(i == 20 ){
//           console.log("wrist = " + scale)
//           torus.position.x = -pos.x;
//           torus.position.y = pos.y;
//           torus.position.z = scale;
//         }

//         if(i == 3){
//           console.log("Bilhagh : " + scale);
//         }


//         sphere.visible = true;
//         // sphere.position.set(handWorldLandmarks[i].x, -handWorldLandmarks[i].y, -handWorldLandmarks[i].z);
//       });

//       renderer.render(scene, camera);
//       return;
//     }
//     // SetCursorVisibility(true);

//     // console.log(res);

//     // Change color depending on gesture.
//     if (res.poses.fistProb > thresholds.FIST) {
//     //   SetCursorColor('red');
//     } else if (res.poses.pinchProb > thresholds.PINCH) {
//     //   SetCursorColor('green');
//     } else {
//     //   SetCursorColor('blue');
//     }

//     // Change cursor position.
//     // We only use one coordinate here...
//     // SetCursorPosition(...res.coordinates[0]);


//   });
}

Run();

