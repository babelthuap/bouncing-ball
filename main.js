(() => {
'use strict';

const acceleration = -0.000045; // Gravity
const floorLevel = -4;
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

  // Move camera
  camera.position.x = 1;
  camera.position.y = 5;
  camera.position.z = 20;
  
  // Transform meshes
  SceneObject.ball.position.y = 9;
  SceneObject.ball.name = 'ball';
  SceneObject.floor.rotation.x = Math.PI / 2;
  SceneObject.wallX.rotation.y = Math.PI / 2;
  SceneObject.wallX.position.x = -6;
  SceneObject.wallX.position.y = 6;
  SceneObject.wallZ.position.y = 6;
  SceneObject.wallZ.position.z = -6;

  // Add objects to scene and shift everything down
  for (const obj of Object.values(SceneObject)) {
    scene.add(obj);
    obj.position.y += floorLevel;
  }

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

  // three.js extensions
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  new THREEx.WindowResize(renderer, camera);

  initAnimation(renderer, scene, camera, controls);
}

// Initializes animation and basic physics simulation.
function initAnimation(renderer, scene, camera, controls) {
  const ball = scene.getObjectByName('ball');
  const initialBallY = ball.position.y;
  let ballMoving, prevT;
  restart();
  document.getElementById('restart').addEventListener('click', restart);

  function restart() {
    ball.position.y = initialBallY;
    ball.velocity = 0;
    ballMoving = true;
    prevT = Date.now();
  }

  (function update() {
    renderer.render(scene, camera);
    controls.update();
    // Move ball
    if (ballMoving) {
      const currentT = Date.now();
      ballMoving = moveBall(ball, currentT - prevT);
      prevT = currentT;
    }
    // Schedule the next frame
    requestAnimationFrame(update);
  })();
}

// Updates the position and velocity of the ball. Returns true iff the ball is
// still moving.
function moveBall(ball, dt) {
  const minHeight = floorLevel + ball.geometry.parameters.radius;
  const deltaP = positionChange(ball.velocity, dt);
  ball.position.y += deltaP;
  if (ball.position.y > minHeight) {
    ball.velocity += acceleration * dt;
  } else {
    // Handle bounce
    const originalPosition = ball.position.y - deltaP;
    const timeToImpact = timeToFallToPosition(
        originalPosition, ball.velocity, minHeight);
    if (timeToImpact > 0) { // Also tests that !isNaN(timeToImpact)
      const velocityAtImpact = ball.velocity + acceleration * timeToImpact;
      const bounceVelocity =
          -bounceMagnitude(velocityAtImpact) * velocityAtImpact;
      const timeAfterBounce = dt - timeToImpact;
      ball.position.y =
          minHeight + positionChange(bounceVelocity, timeAfterBounce);
      ball.velocity = bounceVelocity + acceleration * timeAfterBounce;
    } else {
      ball.position.y = minHeight;
      return false;
    }
  }
  return true;
}

// Kinematics FTW
function positionChange(v0, dt) {
  return v0 * dt + 0.5 * acceleration * dt * dt;
}

// Quadratic formula! Assumptions: p0 >= targetP and v0 <= 0
function timeToFallToPosition(p0, v0, targetP) {
  const discriminant = v0 * v0 - 2 * acceleration * (p0 - targetP);
  return (-v0 - Math.sqrt(discriminant)) / acceleration;
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
