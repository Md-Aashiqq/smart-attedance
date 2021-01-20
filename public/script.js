const uploadImage = document.getElementById("uploadImage");
const camera = document.getElementById("camera");
const video = document.getElementById("video");
const takePic = document.getElementById("takePic");
const canvas1 = document.getElementById("canvas");
const presentList = document.getElementById("presentList");
const absentList = document.getElementById("absentList");
const loader_con = document.getElementById("loader-con");
const upload_con = document.getElementById("upload-con");
const filter_grp = document.getElementById("filter-grp");
const data_con = document.getElementById("data-con");
const retakePic = document.getElementById("retakePic");

var firebaseConfig = {
  apiKey: "AIzaSyCqAQ0JKkNiq2mH7DANX77y67hut-Y2hms",
  authDomain: "smartcam-3456a.firebaseapp.com",
  databaseURL: "https://smartcam-3456a.firebaseio.com",
  projectId: "smartcam-3456a",
  storageBucket: "smartcam-3456a.appspot.com",
  messagingSenderId: "157826084039",
  appId: "1:157826084039:web:108ee9b1165eb2572422e2",
  measurementId: "G-N3HBCH4BVH",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("/public/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/public/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/public/models"),
]).then(start);

let labeledFaceDiscriptors = [];
let s = [];
let faceMatcher;

let wholeClass = [];
let present = [];

// Start function initilaes the Vidoe function and Load Data form Database

async function start() {
  console.log("loaded");
  takePic.disabled = true;
  uploadImage.disabled = true;
  loader_con.remove();
  AccessVidoe();
  loadData();
  UploadPic();
}

// Acesss Vidoe for access the uer webcam to take pic

function AccessVidoe() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    // on success, stream it in video tag
    .then(function (stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function (err) {
      console.log("An error occurred: " + err);
    });
}

// when the user click take pic button its convert vidoe into image

takePic.addEventListener("click", () => {
  let image = document.getElementsByTagName("img");

  if (image[0]) {
    image[0].remove();
  }

  var width = 320;
  var height = 400;
  var context = canvas1.getContext("2d");
  if (width && height) {
    canvas1.width = width;
    canvas1.height = height;
    context.drawImage(video, 0, 0, width, height);

    var data = canvas1.toDataURL("image/jpeg");

    const photo = document.createElement("img");

    photo.setAttribute("src", data);
    video.style.display = "none";
    retakePic.style.display = "block";
    canvas1.remove();
    camera.append(photo);
    dectectFace(data);
  }
});

retakePic.addEventListener("click", () => {
  video.style.display = "block";
  let image = document.getElementsByTagName("img");
  image[0].remove();
  retakePic.style.display = "none";
});

// loadData function is used to load Array of destipor from firebase

function loadData() {
  data_con.style.display = "flex";
  firebase
    .database()
    .ref("data/")
    .on("value", (snapshot) => {
      if (snapshot.val()) {
        data_con.style.display = "none";
        Object.keys(snapshot.val()).forEach(function (key) {
          let option = document.createElement("option");

          option.text = key;

          option.setAttribute("value", key);

          filter_grp.appendChild(option);
        });
      }
    });
}

filter_grp.addEventListener("change", () => {
  const val = filter_grp.options[filter_grp.selectedIndex].value;

  if (val != null) {
    takePic.disabled = false;
    uploadImage.disabled = false;
    firebase
      .database()
      .ref(`data/${val}`)
      .once("value", (snapshot) => {
        labeledFaceDiscriptors = snapshot.val();
      })
      .then(() => {
        faceMatching(labeledFaceDiscriptors);
      });
  }
});

function UploadPic() {
  uploadImage.addEventListener("change", async () => {
    // s = [];
    // faceMatcher;
    // wholeClass = [];
    // present = [];
    let image = document.getElementsByTagName("img");

    if (image[0]) {
      image[0].remove();
    }

    dectectFace("upload");
  });
}

async function dectectFace(srcs) {
  present = [];

  const container = document.createElement("div");
  container.style.position = "relative";
  camera.append(container);

  let image;
  let canvas;

  if (image) image.remove();

  if (canvas) canvas.remove();
  upload_con.style.display = "flex";

  if (srcs === "upload") {
    image = await faceapi.bufferToImage(uploadImage.files[0]);
    container.append(image);
  } else {
    image = await document.createElement("img");

    image.setAttribute("src", srcs);
  }

  upload_con.style.display = "none";

  video.remove();

  canvas = faceapi.createCanvasFromMedia(image);

  container.append(canvas);

  console.log("append canvas");

  const displaySize = { width: image.width, height: image.height };

  faceapi.matchDimensions(canvas, displaySize);

  let fullFaceDiscription = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withFaceDescriptors();

  const resizedDetection = faceapi.resizeResults(
    fullFaceDiscription,
    displaySize
  );

  const results = resizedDetection.map((d) =>
    faceMatcher.findBestMatch(d.descriptor)
  );

  results.forEach((result, i) => {
    const box = resizedDetection[i].detection.box;
    const drawBox = new faceapi.draw.DrawBox(box, {
      label: result.toString(),
    });
    drawBox.draw(canvas);

    let li = document.createElement("li");

    let name = result.toString();

    li.textContent = name.substr(0, name.indexOf(" "));

    presentList.appendChild(li);

    // presentList.append(`<li>${result.toString()}</li>`);
    present.push(name.substr(0, name.indexOf(" ")));
    console.log(result.toString());
  });
  calcAbsent();
  faceapi.draw.drawDetections(canvas, fullFaceDiscription);
}

function calcAbsent() {
  console.log(present);
  wholeClass = wholeClass.filter((el) => {
    return present.indexOf(el) < 0;
  });

  for (let i = 0; i < wholeClass.length; i++) {
    let li = document.createElement("li");
    li.textContent = wholeClass[i];
    absentList.appendChild(li);
  }

  console.log(wholeClass);
}

async function faceMatching() {
  const res = await faceMat(labeledFaceDiscriptors);
  faceMatcher = new faceapi.FaceMatcher(res, 0.6);
}

function faceMat(labeledFaceDiscriptors) {
  // labelsWithDec = labeledFaceDiscriptors;
  wholeClass = [];
  return Promise.all(
    labeledFaceDiscriptors.map(async (ob) => {
      let label = ob._label;
      wholeClass.push(label);
      let descriptors = new Float32Array(ob._descriptors[0]);
      return new faceapi.LabeledFaceDescriptors(label, [descriptors]);
    })
  );
}
