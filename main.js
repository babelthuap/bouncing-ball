(() => {
'use strict';

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
  const acceleration = -0.007;
  let ballVelocity = 0;
  let step = 0;

  (function update() {
    // Move ball
    ball.position.y += ballVelocity;
    ballVelocity += acceleration;
    if (ballVelocity < 0 &&
        ball.position.y <= ball.geometry.parameters.radius) {
      // Bounce!
      ballVelocity = -bounceMagnitude(ballVelocity) * ballVelocity;
    }

    // Move camera
    camera.position.x = Math.min(20, 20 * (step / 700));
    camera.position.z = Math.max(0, 20 * (1 - step / 700));
    camera.lookAt(new THREE.Vector3(0, 5, 0));
    step++;

    renderer.render(scene, camera);
    requestAnimationFrame(update);
  })();
}

// Simple sigmoid function chosen so that v = -0.5 returns 0.95.
// Totally hacked together.
function bounceMagnitude(v) {
  return Math.abs(38 * v) / (1 + Math.abs(38 * v));
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
