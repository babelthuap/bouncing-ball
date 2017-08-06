(() => {
'use strict';

const acceleration = -0.000015; // Gravity
const cameraMoveDurationMs = 12000;
init();

// Initializes scene, camera, and renderer.
function init() {
  // Set up scene and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45, // field of view
    window.innerWidth / window.innerHeight, // aspect ratio
    1, // near clipping plane (beyond which nothing is visible)
    1000, // far clipping plane (beyond which nothing is visible)
  );

  // Create objects
  const SceneObject = {
    ball: getSphere(2, 0xdd0000 /* red */),
    floor: getPlane(12, 12, 0xbbbbbb),
    wallX: getPlane(12, 12, 0xdddddd),
    wallZ: getPlane(12, 12, 0xdddddd),
    spotlight1: getSpotlight(0x91c8ff, 1.5, 10, 18, 10),
    spotlight2: getSpotlight(0xffdcb4, 1.5, -6, 18, 6),
  };

  // Add objects to scene
  for (const obj of Object.values(SceneObject)) {
    scene.add(obj);
  }

  // Move camera
  camera.position.x = 0;
  camera.position.y = 5;
  camera.position.z = 20;
  camera.lookAt(new THREE.Vector3(0, 5, 0));
  
  // Transform meshes
  SceneObject.ball.position.y = 4 * SceneObject.ball.geometry.parameters.radius;
  SceneObject.ball.name = 'ball';
  SceneObject.floor.rotation.x = Math.PI / 2;
  SceneObject.wallX.rotation.y = Math.PI / 2;
  SceneObject.wallX.position.x = -6;
  SceneObject.wallX.position.y = 6;
  SceneObject.wallZ.position.y = 6;
  SceneObject.wallZ.position.z = -6;

  // Add shadows
  SceneObject.ball.castShadow = true;
  SceneObject.floor.receiveShadow = true;
  SceneObject.wallX.receiveShadow = true;
  SceneObject.wallZ.receiveShadow = true;

  // Set up renderer
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById('webgl').appendChild(renderer.domElement);

  initAnimation(renderer, scene, camera);
}

// Initializes animation and basic physics simulation.
function initAnimation(renderer, scene, camera) {
  const ball = scene.getObjectByName('ball');
  let ballMoving = true;
  let ballVelocity = 0;
  let prevT = Date.now();
  let elapsedT = 0;

  (function update() {
    // Update time counters
    const currentT = Date.now();
    const deltaT = currentT - prevT;
    elapsedT += deltaT;
    prevT = currentT;

    // Move ball
    if (ballMoving) {
      ball.position.y +=
          ballVelocity * deltaT + 0.5 * acceleration * (deltaT ** 2);
      ballVelocity += acceleration * deltaT;
      if (ball.position.y <= ball.geometry.parameters.radius) {
        // Deform ball so it never clips through the floor
        ball.scale.y = ball.position.y / ball.geometry.parameters.radius;
        ball.scale.x = ball.scale.z = 1 / ball.scale.y;
        console.log('ballVelocity:', ballVelocity);
        if (ballVelocity < 0) {
          // Bounce!
          ballVelocity = -bounceMagnitude(ballVelocity) * ballVelocity;
        }
        if (Math.abs(ballVelocity) < 0.001) {
          ballMoving = false;
        }
      } else {
        ball.scale.y = ball.scale.x = ball.scale.z = 1;
      }
    }

    // Move camera
    camera.position.x = Math.min(20, 20 * (elapsedT / cameraMoveDurationMs));
    camera.position.z = Math.max(0, 20 * (1 - elapsedT / cameraMoveDurationMs));
    camera.lookAt(new THREE.Vector3(0, 5, 0));

    // Render, then schedule the next frame
    renderer.render(scene, camera);
    if (ballMoving || elapsedT < cameraMoveDurationMs) {
      requestAnimationFrame(update);
    }
  })();
}

// Simple sigmoid function chosen so that v = -0.01 returns 0.9.
// Totally hacked together.
function bounceMagnitude(v) {
  return Math.abs(900 * v) / (1 + Math.abs(900 * v));
}

// Creates a sphere with the specified radius and color.
function getSphere(radius, color) {
  const geometry = new THREE.SphereGeometry(radius, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    bumpScale: 0.02,
    color: color,
    bumpMap: window.texture,
    metalness: 0.7,
    roughness: 0.9,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Creates a plane with the specifed dimensions and color.
function getPlane(width, height, color) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshStandardMaterial({
    bumpScale: 0.09,
    color: color,
    bumpMap: window.metalTexture,
    map: window.metalTexture,
    roughnessMap: window.metalTexture,
    metalness: 0.65,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  for (const mapType of ['bumpMap', 'map', 'roughnessMap']) {
    material[mapType].wrapS = THREE.RepeatWrapping;
    material[mapType].wrapT = THREE.RepeatWrapping;
    material[mapType].repeat.set(3, 2);
  };
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Creates a spotlight, dude.
function getSpotlight(color, intensity, x, y, z) {
  const light = new THREE.SpotLight(color, intensity);
  light.position.x = x;
  light.position.y = y;
  light.position.z = z;
  light.castShadow = true;
  light.shadow.mapSize.x = 4096;
  light.shadow.mapSize.y = 4096;
  return light;
}
})();
