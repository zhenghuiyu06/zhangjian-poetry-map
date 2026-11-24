import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { makeXiaotong } from './xiaotong-character.mjs';

// Node's Blob provides the array buffer used by the browser-oriented GLB exporter.
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend();
  }
};

const output = resolve(process.argv[2] || 'v3');
await mkdir(resolve(output, 'assets'), { recursive: true });
await mkdir(resolve(output, 'vendor'), { recursive: true });
const model = await new GLTFExporter().parseAsync(makeXiaotong(), { binary: true });
await writeFile(resolve(output, 'assets/xiaotong-wolf.glb'), new Uint8Array(model));

await build({
  stdin: {
    contents: [
      "export { AmbientLight, DirectionalLight, HemisphereLight, OrthographicCamera, Scene, WebGLRenderer, SRGBColorSpace, ACESFilmicToneMapping, Mesh, CircleGeometry, ShadowMaterial, PCFShadowMap } from 'three';",
      "export { OrbitControls } from 'three/addons/controls/OrbitControls.js';",
      "export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';"
    ].join('\n'),
    resolveDir: import.meta.dirname
  },
  bundle: true,
  minify: true,
  format: 'esm',
  outfile: resolve(output, 'vendor/xiaotong-webgl.mjs')
});
const require = createRequire(import.meta.url);
await copyFile(resolve(require.resolve('three'), '../../LICENSE'), resolve(output, 'vendor/three.LICENSE.txt'));
