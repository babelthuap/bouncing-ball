(() => {
'use strict';

init();

// Initializes scene, camera, and animation rendering.
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
    ball: getSphere(2, 0xff0000 /* red */),
    plane: getPlane(10, 10, 0xdddddd /* gray */),
    spotlight1: getSpotlight(0xffffff, 1.5, 5, 10, 4),
    spotlight2: getSpotlight(0xffffff, 1.5, -5, 10, 4),
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
  SceneObject.plane.rotation.x = Math.PI/2;
  SceneObject.ball.position.y = 4 * SceneObject.ball.geometry.parameters.radius;

  // Set up renderer
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('webgl').appendChild(renderer.domElement);

  // Physics stuff
  const acceleration = -0.007;
  let ballVelocity = 0;

  // Init animation
  (function update() {
    const ball = SceneObject.ball;
    ball.position.y += ballVelocity;
    ballVelocity += acceleration;
    if (ballVelocity < 0 &&
        ball.position.y <= ball.geometry.parameters.radius) {
      // Bounce!
      ballVelocity = -bounceMagnitude(ballVelocity) * ballVelocity;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(() => {
      update(renderer, scene, camera);
    });
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
  const material = new THREE.MeshStandardMaterial({color});
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Creates a plane with the specifed dimensions and color.
function getPlane(width, height, color) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Creates a spotlight, dude.
function getSpotlight(color, intensity, x, y, z) {
  const light = new THREE.SpotLight(color, intensity);
  light.position.x = x;
  light.position.y = y;
  light.position.z = z;
  return light;
}
})();
