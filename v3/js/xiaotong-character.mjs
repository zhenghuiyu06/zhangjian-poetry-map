import * as THREE from 'three';

const vec = (point) => new THREE.Vector3(...point);
const up = new THREE.Vector3(0, 1, 0);
const front = new THREE.Vector3(0, 0, 1);

export function makeXiaotong() {
  const wolf = new THREE.Group();
  wolf.name = 'Xiaotong';
  const material = (name, color, roughness = 0.72) => new THREE.MeshStandardMaterial({ name, color, roughness });
  const fur = material('Slate gray fur', '#686e7b');
  const darkFur = material('Dark gray fur', '#525966');
  const pale = material('Cream fur', '#eee2d0');
  const earFur = material('Inner ears', '#e3cfb8');
  const black = material('Nose and pupils', '#202024', 0.3);
  const mouth = material('Mouth', '#462d2d');
  const iris = material('Golden eyes', '#f8bf24', 0.36);
  const white = material('Ivory', '#fff8e8');
  const red = material('Red number 13 shirt', '#bd242b');
  const redTrim = material('Shirt hem', '#a62629');
  const blue = material('Blue shorts', '#2957a6');
  const darkBlue = material('Shorts hem', '#203d79');
  const sock = material('White socks', '#e9e8e5');
  const sockRib = material('Sock cuffs', '#d1d3d4');
  const boot = material('Golden football boots', '#e4a422', 0.53);
  const sole = material('Boot soles', '#ac7018');
  const lace = material('Boot laces', '#f8cd58');
  const ballSeam = material('Ball seams', '#a39d90');
  const ballBlack = material('Black ball panels', '#313236');

  const sphere = new THREE.SphereGeometry(1, 32, 20);
  function mesh(name, geometry, finish, location = [0, 0, 0], parent = wolf) {
    geometry.deleteAttribute('uv');
    const piece = new THREE.Mesh(geometry, finish);
    piece.name = name;
    piece.position.copy(vec(location));
    parent.add(piece);
    return piece;
  }
  function oval(name, at, scale, finish, parent = wolf) {
    const piece = mesh(name, sphere, finish, at, parent);
    piece.scale.set(...scale);
    return piece;
  }
  function limb(name, from, to, radius, finish) {
    const start = vec(from);
    const end = vec(to);
    const axis = end.clone().sub(start);
    const length = Math.max(0.005, axis.length() - radius * 2);
    const piece = mesh(name, new THREE.CapsuleGeometry(radius, length, 8, 20), finish, start.lerp(end, 0.5).toArray());
    piece.quaternion.setFromUnitVectors(up, axis.normalize());
    return piece;
  }
  function stroke(name, points, width, finish, parent = wolf) {
    const path = new THREE.CatmullRomCurve3(points.map(vec), false, 'centripetal');
    return mesh(name, new THREE.TubeGeometry(path, Math.max(12, points.length * 6), width, 8, false), finish, [0, 0, 0], parent);
  }
  function joint(name, pivot, pieces) {
    const group = new THREE.Group();
    group.name = name;
    group.position.copy(vec(pivot));
    wolf.add(group);
    for (const piece of pieces) group.attach(piece);
    return group;
  }
  function taper(name, points, radii, finish) {
    const path = new THREE.CatmullRomCurve3(points.map(vec), false, 'centripetal');
    const positions = [];
    const indices = [];
    const rows = 30;
    const sides = 18;
    const frames = path.computeFrenetFrames(rows, false);
    for (let row = 0; row <= rows; row += 1) {
      const t = row / rows;
      const center = path.getPointAt(t);
      const fraction = t * (radii.length - 1);
      const part = Math.min(radii.length - 2, Math.floor(fraction));
      const radius = THREE.MathUtils.lerp(radii[part], radii[part + 1], fraction - part);
      for (let side = 0; side < sides; side += 1) {
        const angle = side * Math.PI * 2 / sides;
        const ring = center.clone()
          .addScaledVector(frames.normals[row], Math.cos(angle) * radius)
          .addScaledVector(frames.binormals[row], Math.sin(angle) * radius);
        positions.push(...ring.toArray());
        if (row === rows) continue;
        const a = row * sides + side;
        const b = row * sides + (side + 1) % sides;
        indices.push(a, b, a + sides, b, b + sides, a + sides);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return mesh(name, geometry, finish);
  }

  const profile = new THREE.SplineCurve([
    [0, 1.48], [0.47, 1.48], [0.54, 1.57], [0.52, 1.79],
    [0.58, 2.11], [0.66, 2.36], [0.63, 2.51], [0.35, 2.62], [0, 2.62]
  ].map(([r, y]) => new THREE.Vector2(r, y))).getPoints(74);
  const jersey = mesh('Football shirt', new THREE.LatheGeometry(profile, 56), red);
  jersey.scale.z = 0.8;
  oval('Shorts seat', [0.01, 1.51, -0.035], [0.54, 0.34, 0.39], blue);
  const hem = oval('Shirt hem', [0, 1.57, 0], [0.537, 0.055, 0.432], redTrim);
  hem.rotation.z = -0.024;
  oval('Neck', [0, 2.62, 0.03], [0.265, 0.25, 0.245], fur);
  const chest = (x, y) => {
    const nearest = profile.reduce((a, b) => Math.abs(a.y - y) < Math.abs(b.y - y) ? a : b);
    return [x, y, 0.8 * Math.sqrt(Math.max(0, nearest.x ** 2 - x ** 2)) + 0.018];
  };
  stroke('V neck trim', [[-0.31, 2.52], [-0.15, 2.43], [0, 2.36], [0.15, 2.43], [0.31, 2.52]]
    .map(([x, y]) => chest(x, y)), 0.039, white);
  stroke('Jersey digit 1', [[-0.25, 2.16], [-0.15, 2.23], [-0.15, 1.9]].map(([x, y]) => chest(x, y)), 0.032, white);
  stroke('Jersey digit 3', [[0.015, 2.196], [0.09, 2.232], [0.19, 2.205], [0.21, 2.125], [0.095, 2.067], [0.215, 2.02], [0.21, 1.938], [0.12, 1.894], [0.018, 1.933]].map(([x, y]) => chest(x, y)), 0.032, white);

  function arm(label, shoulder, sleeveEnd, elbow, wrist) {
    const outer = vec(sleeveEnd);
    const axis = outer.clone().sub(vec(shoulder)).normalize();
    const sleeveMiddle = vec(shoulder).lerp(outer, 0.53);
    const sleeve = taper(label + ' sleeve', [shoulder, sleeveMiddle.toArray(), sleeveEnd], [0.205, 0.241, 0.209], red);
    const cuff = oval(label + ' sleeve band', sleeveEnd, [0.212, 0.051, 0.212], white);
    cuff.quaternion.setFromUnitVectors(up, axis);
    const armBase = outer.clone().addScaledVector(axis, -0.078);
    const pieces = [taper(label + ' arm', [armBase.toArray(), elbow, wrist], [0.158, 0.171, 0.148, 0.127], fur)];
    const hand = oval(label + ' paw', wrist, [0.193, 0.168, 0.154], pale);
    hand.rotation.z = label === 'Raised' ? -0.28 : 0.18;
    const [x, y, z] = wrist;
    pieces.push(hand, oval(label + ' thumb', [x + (label === 'Raised' ? -0.12 : 0.109), y - 0.011, z + 0.09], [0.084, 0.087, 0.085], earFur));
    for (const offset of [-0.055, 0.015, 0.085]) {
      pieces.push(oval(label + ' knuckle', [x + offset, y + 0.058, z + 0.082], [0.067, 0.082, 0.079], pale));
    }
    const forearm = joint('Xiaotong' + label + 'Forearm', sleeveEnd, pieces);
    joint('Xiaotong' + label + 'Arm', shoulder, [sleeve, cuff, forearm]);
  }
  arm('Raised', [0.51, 2.4, 0], [0.865, 2.29, 0.1], [1.04, 2.27, 0.29], [1.17, 2.65, 0.51]);
  arm('Trailing', [-0.5, 2.37, 0], [-0.857, 2.21, -0.14], [-1.0, 2.08, -0.30], [-1.21, 1.92, -0.48]);

  function leg(label, hip, knee, ankle, shoe, angle) {
    const mid = vec(hip).lerp(vec(knee), 0.66);
    const direction = vec(knee).sub(vec(hip)).normalize();
    const shorts = limb(label + ' shorts', hip, mid.clone().addScaledVector(direction, 0.13).toArray(), 0.255, blue);
    const seam = oval(label + ' shorts cuff', mid.toArray(), [0.235, 0.07, 0.235], darkBlue);
    seam.quaternion.setFromUnitVectors(up, direction);
    const thigh = limb(label + ' thigh', mid.toArray(), vec(knee).lerp(vec(ankle), 0.16).toArray(), 0.175, fur);
    const stocking = limb(label + ' sock', knee, vec(ankle).addScaledVector(up, -0.08).toArray(), 0.152, sock);
    const calf = vec(knee).lerp(vec(ankle), 0.25);
    const rib = oval(label + ' sock cuff', calf.toArray(), [0.155, 0.048, 0.155], sockRib);
    rib.quaternion.setFromUnitVectors(up, vec(ankle).sub(vec(knee)).normalize());
    const foot = new THREE.Group();
    foot.name = label + ' boot';
    foot.position.copy(vec(shoe));
    foot.rotation.set(...angle);
    wolf.add(foot);
    oval('Studded outsole', [0, -0.072, 0.085], [0.19, 0.058, 0.309], sole, foot);
    oval('Leather upper', [0, 0.012, 0.12], [0.186, 0.139, 0.286], boot, foot);
    oval('Padded heel', [0, 0.072, -0.06], [0.151, 0.138, 0.154], boot, foot);
    for (let i = 0; i < 3; i += 1) {
      stroke('Lace', [[-0.073, 0.121 - i * 0.008, 0.07 + i * 0.053], [0, 0.143 - i * 0.008, 0.06 + i * 0.053], [0.073, 0.121 - i * 0.008, 0.058 + i * 0.053]], 0.014, lace, foot);
    }
    for (const x of [-0.096, 0.096]) {
      for (const z of [-0.055, 0.16, 0.28]) oval('Stud', [x, -0.113, z], [0.034, 0.037, 0.035], boot, foot);
    }
    const ankleJoint = joint('Xiaotong' + label + 'Ankle', ankle, [foot]);
    const kneeJoint = joint('Xiaotong' + label + 'Knee', knee, [stocking, rib, ankleJoint]);
    joint('Xiaotong' + label + 'Hip', hip, [shorts, seam, thigh, kneeJoint]);
  }
  leg('Lead', [0.245, 1.69, 0.08], [0.49, 1.02, 0.43], [0.52, 0.31, 0.53], [0.54, 0.201, 0.56], [0.09, -0.19, -0.1]);
  leg('Trail', [-0.248, 1.62, -0.04], [-0.62, 1.09, -0.32], [-0.67, 0.75, -0.79], [-0.70, 0.71, -0.86], [-0.7, -0.16, -0.22]);
  joint('XiaotongTail', [0, 1.61, -0.29], [
    taper('Bushy tail', [[0, 1.61, -0.29], [-0.22, 1.49, -0.57], [-0.52, 1.55, -0.89], [-0.88, 1.75, -1.07], [-1.08, 1.99, -1.06]], [0.139, 0.225, 0.245, 0.184, 0.005], darkFur),
    taper('Tail tuft', [[-0.59, 1.62, -0.93], [-0.88, 1.65, -1.04], [-1.06, 1.74, -1.03]], [0.129, 0.12, 0.004], fur)
  ]);

  const headStart = wolf.children.length;
  oval('Wolf head', [0, 3.1, 0.02], [0.685, 0.58, 0.55], fur);
  const jaw = oval('Cream lower jaw', [0, 2.762, 0.594], [0.40, 0.147, 0.347], pale);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      const y = 2.92 + i * 0.12;
      taper('Pointed side fur', [[side * 0.38, y, 0.08], [side * 0.59, y + 0.015, 0.06],
        [side * (0.72 + i * 0.022), y + 0.081, -0.016]], [0.112, 0.082, 0.003], fur);
    }
    const cheek = oval('Cream cheek', [side * 0.337, 2.931, 0.421], [0.261, 0.167, 0.196], pale);
    cheek.rotation.z = side * 0.26;
    taper('Cream cheek tuft', [[side * 0.263, 2.922, 0.462], [side * 0.476, 2.948, 0.458],
      [side * 0.619, 2.99, 0.391]], [0.09, 0.07, 0.003], pale);

    const ear = new THREE.Group();
    ear.name = 'Pointed ear';
    ear.position.set(side * 0.423, 3.48, -0.048);
    ear.rotation.set(-0.09, side * 0.14, -side * 0.23);
    ear.scale.y = 0.83;
    wolf.add(ear);
    const outline = new THREE.Shape();
    outline.moveTo(-0.226, 0);
    outline.bezierCurveTo(-0.219, 0.31, -0.129, 0.51, -0.005, 0.671);
    outline.bezierCurveTo(0.032, 0.728, 0.068, 0.705, 0.093, 0.636);
    outline.bezierCurveTo(0.197, 0.414, 0.216, 0.199, 0.222, 0);
    outline.quadraticCurveTo(0, -0.079, -0.226, 0);
    const shell = new THREE.ExtrudeGeometry(outline, { depth: 0.157, bevelSize: 0.043, bevelThickness: 0.043, bevelSegments: 4, curveSegments: 18 });
    function shapeEar(geometry) {
      const position = geometry.getAttribute('position');
      for (let i = 0; i < position.count; i += 1) {
        const height = THREE.MathUtils.clamp(position.getY(i) / 0.73, 0, 1);
        position.setZ(i, position.getZ(i) * (1 - 0.73 * height) - height ** 2 * 0.045);
      }
      geometry.computeVertexNormals();
      return geometry;
    }
    mesh('Cream inner ear', shapeEar(shell.clone().scale(0.71, 0.83, 0.23).translate(0.004, 0.058, 0.087)), earFur, [0, 0, 0], ear);
    mesh('Outer ear', shapeEar(shell.translate(0, 0, -0.09)), fur, [0, 0, 0], ear);
    stroke('Inner ear tuft', [[0.071, 0.11, 0.106], [0.031, 0.17, 0.12], [0.012, 0.215, 0.096]], 0.024, pale, ear);

    const eye = new THREE.Group();
    eye.name = 'Gold eye';
    eye.position.set(side * 0.244, 3.23, 0.481);
    eye.rotation.set(-0.07, side * 0.22, -side * 0.056);
    wolf.add(eye);
    const eyelid = new THREE.Group();
    eyelid.name = side < 0 ? 'XiaotongLeftEye' : 'XiaotongRightEye';
    eye.add(eyelid);
    oval('Dark eye rim', [0, 0, 0.022], [0.128, 0.19, 0.069], darkFur, eyelid);
    oval('Iris', [0, 0, 0.047], [0.107, 0.168, 0.071], iris, eyelid);
    oval('Pupil', [0.029, -0.007, 0.111], [0.046, 0.107, 0.035], black, eyelid);
    oval('Eye glint', [0.041, 0.056, 0.142], [0.017, 0.03, 0.009], white, eyelid);
    stroke('Arched brow', [[-0.119, 0.19, -0.011], [-0.053, 0.246, -0.035],
      [0.026, 0.25, -0.035], [0.098, 0.215, -0.02]], 0.022, darkFur, eye);
  }
  const nose = new THREE.Shape();
  nose.moveTo(-0.146, 0.071);
  nose.bezierCurveTo(-0.11, 0.113, 0.11, 0.113, 0.146, 0.071);
  nose.bezierCurveTo(0.169, 0.036, 0.097, -0.062, 0.033, -0.101);
  nose.quadraticCurveTo(0, -0.124, -0.033, -0.101);
  nose.bezierCurveTo(-0.097, -0.062, -0.169, 0.036, -0.146, 0.071);
  oval('Long cream muzzle', [0, 2.983, 0.675], [0.436, 0.186, 0.424], pale);
  mesh('Black nose', new THREE.ExtrudeGeometry(nose, { depth: 0.072, bevelThickness: 0.046, bevelSize: 0.034, bevelSegments: 5, curveSegments: 16 }), black, [0.02, 3.052, 1.066]);
  const grin = [[-0.332, 2.898, 0.794], [-0.234, 2.818, 0.927], [0, 2.78, 0.972],
    [0.22, 2.814, 0.94], [0.334, 2.887, 0.799]];
  const smile = [
    jaw,
    stroke('Grin outline', grin, 0.052, mouth),
    stroke('Smile teeth', grin.map(([x, y, z]) => [x * 0.86, y + 0.004, z + 0.027]), 0.037, white)
  ];
  for (const x of [-0.178, -0.074, 0.043, 0.161]) {
    const y = 2.781 + x * x * 0.8;
    const z = 1.028 - x * x * 1.25;
    smile.push(stroke('Tooth line', [[x, y + 0.024, z], [x + 0.018, y - 0.024, z]], 0.006, mouth));
  }
  joint('XiaotongJaw', [0, 2.79, 0.63], smile);
  joint('XiaotongHead', [0, 2.77, 0.12], wolf.children.slice(headStart));

  const ball = new THREE.Group();
  ball.name = 'Football';
  ball.position.set(0.95, 0.35, 1.03);
  ball.rotation.set(0.4, 0.29, 0.1);
  wolf.add(ball);
  const radius = 0.348;
  oval('Ball base', [0, 0, 0], [radius - 0.008, radius - 0.008, radius - 0.008], ballSeam, ball);
  const ico = new THREE.IcosahedronGeometry(1, 0).getAttribute('position');
  const corners = new Map();
  const unique = (v) => {
    const key = v.toArray().map(n => n.toFixed(4)).join(',');
    if (!corners.has(key)) corners.set(key, { point: v, neighbors: new Set() });
    return corners.get(key);
  };
  const cut = (a, b) => a.clone().lerp(b, 1 / 3).normalize();
  function panel(name, points, finish) {
    const center = points.reduce((sum, p) => sum.add(p), new THREE.Vector3()).normalize();
    const edges = points.map(p => p.clone().lerp(center, 0.039).normalize());
    const vertices = [];
    const normals = [];
    function triangle(a, b, c) {
      if (b.clone().sub(a).cross(c.clone().sub(a)).dot(center) < 0) [b, c] = [c, b];
      for (const v of [a, b, c]) {
        normals.push(...v.toArray());
        vertices.push(...v.clone().multiplyScalar(radius).toArray());
      }
    }
    for (let i = 0; i < edges.length; i += 1) {
      const a = edges[i], b = edges[(i + 1) % edges.length];
      const ab = a.clone().add(b).normalize(), ca = center.clone().add(a).normalize(), cb = center.clone().add(b).normalize();
      triangle(center, ca, cb);
      triangle(ca, a, ab);
      triangle(cb, ab, b);
      triangle(ca, ab, cb);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    mesh(name, geometry, finish, [0, 0, 0], ball);
  }
  for (let i = 0; i < ico.count; i += 3) {
    const [a, b, c] = [i, i + 1, i + 2].map(index => unique(new THREE.Vector3().fromBufferAttribute(ico, index)));
    a.neighbors.add(b).add(c);
    b.neighbors.add(a).add(c);
    c.neighbors.add(a).add(b);
    const [v, w, x] = [a.point, b.point, c.point];
    panel('White hexagon', [cut(v, w), cut(w, v), cut(w, x), cut(x, w), cut(x, v), cut(v, x)], white);
  }
  for (const { point, neighbors } of corners.values()) {
    const x = point.clone().cross(Math.abs(point.y) > 0.8 ? front : up).normalize();
    const y = point.clone().cross(x);
    const points = [...neighbors].map(neighbor => cut(point, neighbor.point));
    const angle = (v) => Math.atan2(v.dot(y), v.dot(x));
    panel('Black pentagon', points.sort((a, b) => angle(a) - angle(b)), ballBlack);
  }
  return wolf;
}
