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

  // Create meshes
  const ball = getSphere(2, 0xff0000 /* red */);
  const plane = getPlane(12, 10, 0xdddddd /* gray */);

  // Add meshes to scene
  scene.add(ball);
  scene.add(plane);

  // Move camera
  camera.position.x = 0;
  camera.position.y = 5;
  camera.position.z = 20;
  camera.lookAt(new THREE.Vector3(0, 5, 0));
  
  // Transform meshes
  plane.rotation.x = Math.PI/2;
  ball.position.y = 4 * ball.geometry.parameters.radius;

  // Set up renderer
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('webgl').appendChild(renderer.domElement);

  // Physics stuff
  const acceleration = -0.007;
  let ballVelocity = 0;

  // Init animation
  (function update() {
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
  const material = new THREE.MeshBasicMaterial({color});
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Creates a plane with the specifed dimensions and color.
function getPlane(width, height, color) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}
})();
