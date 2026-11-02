<template>
  <div class="three-wrapper">
    <div ref="container" class="three-container"></div>
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <span class="mt-4 text-caption text-secondary font-weight-bold tracking-widest">LOADING 3D ASSETS...</span>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default {
  name: 'VirtualPart',
  data() {
    return {
      loading: true
    };
  },
  mounted() {
    this.initThree();
  },
  beforeUnmount() {
    this.cleanUp();
  },
  methods: {
    initThree() {
      const container = this.$refs.container;
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // 1. Scene & Camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      this.camera.position.set(6, 4, 10);

      // 2. Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      container.appendChild(this.renderer.domElement);

      // 3. Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 1.0;
      this.controls.enableZoom = false; // 마우스 휠 줌 끄기 (레이아웃 보호)

      // 4. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);
      
      const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
      mainLight.position.set(5, 10, 7);
      mainLight.castShadow = true;
      this.scene.add(mainLight);

      const neonBlue = new THREE.PointLight(0x00f3ff, 20, 15);
      neonBlue.position.set(-5, 2, 5);
      this.scene.add(neonBlue);

      const neonPink = new THREE.PointLight(0xff0080, 15, 15);
      neonPink.position.set(5, -2, -5);
      this.scene.add(neonPink);

      // 5. Load Realistic PC Model (BuildCores Style)
      const loader = new GLTFLoader();
      const modelUrl = 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/gaming-pc/model.gltf';

      loader.load(
        modelUrl,
        (gltf) => {
          this.pcModel = gltf.scene;
          
          // Material Optimization
          this.pcModel.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              if (node.material) {
                node.material.roughness = 0.2;
                node.material.metalness = 0.9;
              }
            }
          });

          // Auto-center and Scale
          const box = new THREE.Box3().setFromObject(this.pcModel);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 5.5 / maxDim;
          this.pcModel.scale.set(scale, scale, scale);
          this.pcModel.position.sub(center.multiplyScalar(scale));
          
          this.scene.add(this.pcModel);
          this.loading = false;
        },
        undefined,
        (error) => {
          console.error('Error loading 3D model:', error);
          this.createFallbackModel();
          this.loading = false;
        }
      );

      // 6. Animation Loop
      const animate = () => {
        if (!this.renderer) return;
        this.frameId = requestAnimationFrame(animate);
        
        if (this.pcModel) {
            this.pcModel.position.y = Math.sin(Date.now() * 0.001) * 0.15; // Floating effect
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      animate();

      // 7. Handle Resize
      this.onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      };
      window.addEventListener('resize', this.onResize);
    },
    createFallbackModel() {
      const geometry = new THREE.BoxGeometry(3, 5, 4);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x00f3ff, 
        wireframe: true,
        emissive: 0x00f3ff,
        emissiveIntensity: 0.5
      });
      const cube = new THREE.Mesh(geometry, material);
      this.scene.add(cube);
      this.pcModel = cube;
    },
    cleanUp() {
      if (this.frameId) cancelAnimationFrame(this.frameId);
      if (this.onResize) window.removeEventListener('resize', this.onResize);
      if (this.renderer) {
        this.renderer.dispose();
      }
    }
  }
};
</script>

<style scoped>
.three-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 450px;
}
.three-container {
  width: 100%;
  height: 100%;
}
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  z-index: 10;
  border-radius: 24px;
}
</style>
