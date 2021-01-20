const trainBtn = document.getElementById("trainBtn");
const modelUpload = document.getElementById("modelImage");
const modelName = document.getElementById("modelName");
const model_con = document.getElementById("model-con");

let filesArray = [];

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// var firebaseConfig = {
//   apiKey: "AIzaSyCqAQ0JKkNiq2mH7DANX77y67hut-Y2hms",
//   authDomain: "smartcam-3456a.firebaseapp.com",
//   databaseURL: "https://smartcam-3456a.firebaseio.com",
//   projectId: "smartcam-3456a",
//   storageBucket: "smartcam-3456a.appspot.com",
//   messagingSenderId: "157826084039",
//   appId: "1:157826084039:web:108ee9b1165eb2572422e2",
//   measurementId: "G-N3HBCH4BVH",
// };
// // Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// firebase.analytics();

// var defaultDatabase = firebase.database();
function loadDatabase(data) {
  let s = modelName.value;
  firebase.database().ref(`data/${s}`).set(data);
  model_con.style.display = "none";
  console.log("stored");
}

// Promise.all([
//   faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
//   faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
//   faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
// ]).then(start);

start();

function start() {
  console.log("loaded");

  trainBtn.addEventListener("click", () => {
    console.log(modelUpload.files);
    for (const file of modelUpload.files) {
      console.log(file.name.split(".").slice(0, -1).join("."));
      filesArray.push(file);
    }

    console.log(modelName.value);

    model_con.style.display = "flex";

    loadIms();
  });
}

async function loadIms() {
  const labeledFaceDiscriptors = await loadLabeledImages();

  loadDatabase(labeledFaceDiscriptors);

  console.log(labeledFaceDiscriptors);
}

function loadLabeledImages() {
  // const labels = [
  //   "bala",
  //   "guhan",
  //   "melfin",
  //   "arunachalam",
  //   "ashick",
  //   "jemisha",
  // ];

  // let paths = "/train_images/";

  return Promise.all(
    filesArray.map(async (file) => {
      const description = [];
      let image = await faceapi.bufferToImage(file);
      // const img = await faceapi.fetchImage(`/train_images/${label}.jpeg`);
      const detection = await faceapi
        .detectSingleFace(image)
        .withFaceLandmarks()
        .withFaceDescriptor();
      description.push(detection.descriptor);

      return new faceapi.LabeledFaceDescriptors(
        file.name.split(".").slice(0, -1).join("."),
        description
      );
    })
  );
}
