import {
  DirectionalLight, HemisphereLight, OrthographicCamera, Scene, WebGLRenderer,
  SRGBColorSpace, ACESFilmicToneMapping, GLTFLoader
} from '../vendor/xiaotong-webgl.mjs';

const asset = new URL('../assets/xiaotong-wolf.glb?v=dribble', import.meta.url);
const duration = { hello: 1740, thinking: 950, reply: 1450 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rigNames = ['Head', 'Jaw', 'RaisedArm', 'RaisedForearm', 'TrailingArm', 'Tail',
  'LeadHip', 'LeadKnee', 'LeadAnkle', 'TrailHip', 'TrailKnee', 'TrailAnkle', 'LeftEye', 'RightEye'];

export async function makeCompanion(launcherSlot, chatSlot, dialog) {
  const canvas = document.createElement('canvas');
  canvas.className = 'xt-render';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
  if (!context) return null;

  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  let model;
  try {
    model = (await new GLTFLoader().loadAsync(asset.href)).scene;
  } catch {
    renderer.dispose();
    return null;
  }

  const scene = new Scene();
  const character = model.getObjectByName('Xiaotong') || model;
  const rig = Object.fromEntries(rigNames.map(name => [name, model.getObjectByName('Xiaotong' + name)]));
  const ball = model.getObjectByName('Football');
  if (!ball || Object.values(rig).some(joint => !joint)) {
    renderer.dispose();
    return null;
  }
  const ballHome = ball.position.clone();
  const ballAngle = ball.rotation.x;
  const key = new DirectionalLight('#fff0db', 2.75);
  key.position.set(-3.5, 6.2, 5);
  const fill = new DirectionalLight('#d3edf4', 1.08);
  fill.position.set(3.7, 4, -3.6);
  scene.add(model, new HemisphereLight('#fffcef', '#7b9990', 2.2), key, fill);
  const camera = new OrthographicCamera(-2.3, 2.3, 2.3, -2.3, 0.1, 30);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let slot;
  let frame = 0;
  let available = true;
  let yaw = 0;
  let pitch = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  let cue = '';
  let cueAt = 0;
  let lastDraw = 0;
  let runStarted = performance.now();

  function runPose(time, running) {
    const elapsed = Math.max(0, time - runStarted);
    const phase = elapsed / 760 * Math.PI * 2;
    const stride = Math.sin(phase);
    const weight = running ? 1 : 0;
    const bob = weight * 0.11 * Math.sin(phase) ** 2;
    rig.LeadHip.rotation.x = weight * (0.28 + 0.78 * stride);
    rig.TrailHip.rotation.x = weight * (-0.37 - 0.72 * stride);
    rig.LeadKnee.rotation.x = weight * (0.04 + 0.78 * Math.max(0, Math.sin(phase + 0.55)));
    rig.TrailKnee.rotation.x = weight * (-0.29 + 0.76 * Math.max(0, -Math.sin(phase + 0.55)));
    rig.LeadAnkle.rotation.x = weight * (0.13 - 0.24 * stride);
    rig.TrailAnkle.rotation.x = weight * (0.58 + 0.22 * stride);
    rig.RaisedArm.rotation.x = weight * (0.27 - 0.56 * stride);
    rig.TrailingArm.rotation.x = weight * (-0.31 + 0.55 * stride);
    rig.Tail.rotation.y = weight * Math.sin(phase + 0.75) * 0.17;
    character.position.y = bob;
    character.rotation.z = weight * stride * 0.042;
    const tap = (1 + Math.sin(phase - 0.52)) / 2;
    ball.position.set(ballHome.x - weight * 0.14 * tap, ballHome.y - bob + weight * 0.035 * tap,
      ballHome.z + weight * 0.27 * tap);
    ball.rotation.x = ballAngle + weight * elapsed * 0.013;
  }

  function chatPose(t, ease) {
    const greeting = cue === 'hello';
    const wave = greeting ? clamp(Math.min(t * 7, (1 - t) * 6), 0, 1) : 0;
    rig.RaisedArm.rotation.z = wave * 0.65;
    rig.RaisedForearm.rotation.z = wave * (0.33 + Math.sin(t * Math.PI * 7) * 0.33);
    rig.Head.rotation.z = greeting ? -0.11 * ease : 0;
    rig.Head.rotation.x = greeting ? 0.11 * Math.sin(t * Math.PI * 4) * ease
      : cue === 'reply' ? 0.055 * Math.sin(t * Math.PI * 6) * ease
      : cue === 'thinking' ? 0.07 * ease : 0;
    const blink = greeting ? Math.max(0, 1 - Math.abs(t - 0.29) / 0.09) : 0;
    rig.LeftEye.scale.y = 1 - 0.94 * blink;
    rig.RightEye.scale.y = 1 - 0.94 * blink;
    rig.Jaw.rotation.x = greeting ? wave * (0.10 + 0.1 * Math.abs(Math.sin(t * 6 * Math.PI)))
      : cue === 'reply' ? Math.abs(Math.sin(t * 9 * Math.PI)) * ease * 0.19 : 0;
  }

  function render(time) {
    frame = 0;
    if (!available || document.hidden) return;
    const running = slot === launcherSlot && !motion.matches;
    // The small, continuously animating entry does not need to render at display refresh rate.
    if (running && time - lastDraw < 31) {
      schedule();
      return;
    }
    lastDraw = time;
    if (motion.matches) {
      cue = '';
      yaw = pitch = targetYaw = targetPitch = 0;
    }
    yaw += (targetYaw - yaw) * 0.2;
    pitch += (targetPitch - pitch) * 0.2;
    const age = time - cueAt;
    if (cue && age >= duration[cue]) cue = '';
    const t = cue ? clamp(age / duration[cue], 0, 1) : 0;
    const ease = Math.sin(t * Math.PI);

    runPose(time, running);
    chatPose(t, ease);
    character.rotation.y = yaw;
    character.rotation.x = pitch + (running ? 0.09 : 0);
    renderer.render(scene, camera);

    if (running || cue || Math.abs(targetYaw - yaw) > 0.002 || Math.abs(targetPitch - pitch) > 0.002) schedule();
  }

  function schedule() {
    if (available && !document.hidden && !frame) frame = requestAnimationFrame(render);
  }

  function resize() {
    if (!slot?.clientWidth || !slot.clientHeight || !available) return;
    const closeUp = slot === chatSlot;
    const height = closeUp ? 1.19 : 2.31;
    const aspect = slot.clientWidth / slot.clientHeight;
    camera.left = -height * aspect;
    camera.right = height * aspect;
    camera.top = height;
    camera.bottom = -height;
    camera.position.set(closeUp ? -2.25 : -4.4, closeUp ? 3.92 : 2.94, 7.5);
    camera.lookAt(closeUp ? 0.13 : 0.02, closeUp ? 3.16 : 2.09, closeUp ? 0.25 : 0.15);
    camera.updateProjectionMatrix();
    renderer.setSize(slot.clientWidth, slot.clientHeight, false);
    schedule();
  }

  const observer = new ResizeObserver(resize);
  function show(next) {
    if (!available || next === slot) return;
    if (slot) {
      observer.unobserve(slot);
      slot.classList.remove('is-live');
    }
    slot = next;
    cue = '';
    lastDraw = 0;
    if (slot === launcherSlot) runStarted = performance.now();
    slot.append(canvas);
    slot.classList.add('is-live');
    targetYaw = targetPitch = 0;
    observer.observe(slot);
    resize();
  }

  canvas.addEventListener('webglcontextlost', () => {
    available = false;
    observer.disconnect();
    cancelAnimationFrame(frame);
    slot?.classList.remove('is-live');
    canvas.remove();
  }, { once: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  show(dialog.open ? chatSlot : launcherSlot);
  return {
    show,
    react(kind) {
      if (!available || motion.matches || slot !== chatSlot) return;
      cue = kind;
      cueAt = performance.now();
      schedule();
    },
    look(x, y) {
      if (!available || motion.matches) return;
      targetYaw = clamp(x, -1, 1) * 0.44;
      targetPitch = clamp(y, -1, 1) * 0.12;
      schedule();
    }
  };
}
