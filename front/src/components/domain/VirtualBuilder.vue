<template>
  <div class="virtual-builder-container glass-card border-neon-cyan">
    <!-- Overlay UI for 3D Control -->
    <div class="viewer-controls d-flex gap-2 pa-2">
      <v-btn size="x-small" icon color="rgba(0,0,0,0.5)" class="border-neon-cyan" @click="resetCamera"><v-icon size="14">mdi-rotate-3d</v-icon></v-btn>
      <v-btn size="x-small" icon color="rgba(0,0,0,0.5)" class="border-neon-cyan" @click="toggleGlass"><v-icon size="14">mdi-glass-stange</v-icon></v-btn>
      <v-btn size="x-small" icon color="rgba(0,0,0,0.5)" class="border-neon-cyan" @click="toggleRGB"><v-icon size="14">mdi-led-on</v-icon></v-btn>
    </div>

    <!-- Central Visualization Area -->
    <div ref="canvasContainer" class="assembly-area position-relative">
      <div v-if="!isInitialized" class="loading-overlay d-flex flex-column align-center">
        <v-icon size="64" color="primary" class="mb-4 scanner-icon">mdi-Desktop-tower-monitor</v-icon>
        <div class="text-h6 font-weight-bold text-white mb-1">엔진 가동 중...</div>
        <div class="text-caption text-secondary">Virtual 3D 환경을 준비하고 있습니다.</div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="status-bar w-100 pa-3 d-flex justify-space-between align-center">
      <div class="d-flex align-center">
        <div class="status-dot mr-2" :class="{ 'bg-success': is3DReady, 'bg-warning': !is3DReady }"></div>
        <span class="text-caption font-weight-bold text-uppercase">{{ is3DReady ? 'Precision 3D Assembly' : 'Basic Visualization' }}</span>
      </div>
      <div class="text-caption text-secondary font-mono">{{ parts.gpu?.name || 'N/A' }}</div>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default {
  name: 'VirtualBuilder',
  props: {
    is3DReady: { type: Boolean, default: false },
    parts: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      isInitialized: false,
      rgbColor: 0x00f3ff,
      glassVisible: true,
      hasError: false
    };
  },
  created() {
    // Three.js 객체들은 Vue의 반응성 시스템(Proxy)과 충돌하므로 data() 외부에 저장
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.components = {};
    this.animationId = null;
  },
  watch: {
    parts: {
      deep: true,
      handler() {
        if (this.isInitialized && !this.hasError) this.updateComponents();
      }
    }
  },
  mounted() {
    // 3D 엔진 즉시 가동 (데이터 분석 완료를 기다리지 않음)
    this.$nextTick(() => {
      try {
        this.initThree();
      } catch (err) {
        console.error('Three.js Init Error:', err);
        this.hasError = true;
      }
    });
  },
  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
      const container = this.$refs.canvasContainer;
      if (container && this.renderer.domElement) {
        container.removeChild(this.renderer.domElement);
      }
    }
    window.removeEventListener('resize', this.onWindowResize);
  },
  methods: {
    initThree() {
      const container = this.$refs.canvasContainer;
      if (!container || this.isInitialized) return;
      
      // 1. Scene Setup
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(0x050508, 2, 15);

      // 2. Camera
      this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      this.camera.position.set(5, 4, 8);

      // 3. Renderer (Premium Settings)
      try {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch (e) {
        this.hasError = true;
        return;
      }
      
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ReinhardToneMapping;
      container.appendChild(this.renderer.domElement);

      // 4. Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.8;
      this.controls.maxDistance = 15;
      this.controls.minDistance = 3;

      // 5. Advanced Lighting
      const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
      mainLight.position.set(5, 10, 7);
      this.scene.add(mainLight);

      const fillLight = new THREE.RectAreaLight(this.rgbColor, 5, 4, 4);
      fillLight.position.set(-5, 2, 2);
      this.scene.add(fillLight);
      this.components.light = fillLight; // Store light reference for RGB control
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      this.scene.add(ambientLight);

      // 5.5 Extra: Scanner Ring (Futuristic Effect)
      const ringGeo = new THREE.TorusGeometry(3.5, 0.02, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.3 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -2.0;
      this.scene.add(ring);
      this.components.scannerRing = ring;

      // 6. Build initial assembly
      this.createPC();
      this.createFloor();

      this.isInitialized = true;
      this.animate();
      window.addEventListener('resize', this.onWindowResize);
    },

    createFloor() {
      const grid = new THREE.GridHelper(20, 20, 0x00f3ff, 0x001a1a);
      grid.position.y = -2.1;
      grid.material.transparent = true;
      grid.material.opacity = 0.2;
      this.scene.add(grid);
    },

    createPC() {
      const group = new THREE.Group();

      // 1. Case (The Frame) - High end look
      const caseGeo = new THREE.BoxGeometry(2.2, 4.8, 4.5);
      const caseMat = new THREE.MeshPhysicalMaterial({
        color: 0x111111,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const pcCase = new THREE.Mesh(caseGeo, caseMat);
      
      const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(caseGeo),
        new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.2 })
      );
      pcCase.add(wireframe);
      group.add(pcCase);

      // 2. Motherboard (Main PCB)
      const mbGeo = new THREE.BoxGeometry(0.1, 3.5, 3.5);
      const mbMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      const motherboard = new THREE.Mesh(mbGeo, mbMat);
      motherboard.position.set(-0.8, 0, 0);
      group.add(motherboard);
      this.components.motherboard = motherboard;

      // 3. Internal Glass Panel
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        metalness: 0,
        roughness: 0,
        transmission: 0.95,
        transparent: true,
        opacity: 0.15,
        thickness: 0.5
      });
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 4.6), glassMat);
      glass.rotation.y = Math.PI / 2;
      glass.position.set(1.11, 0, 0);
      group.add(glass);
      this.components.glass = glass;

      this.scene.add(group);
      this.components.mainGroup = group;

      // 4. Initial Components Update
      this.updateComponents();
    },

    updateComponents() {
      if (!this.scene || this.hasError) return;
      
      // 1. GPU
      if (this.components.gpu) this.components.mainGroup.remove(this.components.gpu);
      const gpuLength = (this.parts.gpu?.length || 280) / 100;
      const gpuGeo = new THREE.BoxGeometry(0.5, 1.2, gpuLength);
      const gpuMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        emissive: this.rgbColor,
        emissiveIntensity: 0.8
      });
      const gpu = new THREE.Mesh(gpuGeo, gpuMat);
      gpu.position.set(-0.3, -0.3, 0);
      this.components.mainGroup.add(gpu);
      this.components.gpu = gpu;

      // 2. Cooler
      if (this.components.cooler) this.components.mainGroup.remove(this.components.cooler);
      const isLiquid = this.parts.cooler?.type === 'Liquid' || this.parts.cooler?.keyword?.toLowerCase().includes('수냉');
      let clrGeo, clrMat;
      
      if (isLiquid) {
        clrGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32);
        clrMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: this.rgbColor, emissiveIntensity: 1.0 });
      } else {
        clrGeo = new THREE.BoxGeometry(1.2, 1.4, 1.0);
        clrMat = new THREE.MeshStandardMaterial({ color: 0x444444, emissive: this.rgbColor, emissiveIntensity: 0.4 });
      }
      const cooler = new THREE.Mesh(clrGeo, clrMat);
      cooler.position.set(-0.5, 1.0, 0);
      if (isLiquid) cooler.rotation.z = Math.PI / 2;
      this.components.mainGroup.add(cooler);
      this.components.cooler = cooler;

      // 3. RAM Slots
      if (this.components.ram) this.components.mainGroup.remove(this.components.ram);
      const ramGroup = new THREE.Group();
      for (let i = 0; i < 2; i++) {
        const ramGeo = new THREE.BoxGeometry(0.05, 1.2, 0.1);
        const ramMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: this.rgbColor, emissiveIntensity: 0.5 });
        const ram = new THREE.Mesh(ramGeo, ramMat);
        ram.position.set(-0.7, 1.0, 0.6 + (i * 0.2));
        ramGroup.add(ram);
      }
      this.components.mainGroup.add(ramGroup);
      this.components.ram = ramGroup;

      // 4. PSU (Bottom)
      if (this.components.psu) this.components.mainGroup.remove(this.components.psu);
      const psuGeo = new THREE.BoxGeometry(1.8, 1.2, 2.0);
      const psuMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
      const psu = new THREE.Mesh(psuGeo, psuMat);
      psu.position.set(0, -1.6, 0);
      this.components.mainGroup.add(psu);
      this.components.psu = psu;
    },

    animate() {
      if (this.hasError || !this.renderer) return;
      this.animationId = requestAnimationFrame(this.animate);
      
      // Animations for BuildCore style
      if (this.components.scannerRing) {
        this.components.scannerRing.rotation.z += 0.01;
        this.components.scannerRing.position.y = -2.0 + Math.sin(Date.now() * 0.002) * 0.1;
      }
      
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    },

    resetCamera() {
      this.camera.position.set(4, 3, 6);
      this.controls.target.set(0, 0, 0);
    },

    toggleGlass() {
      this.glassVisible = !this.glassVisible;
      this.components.glass.visible = this.glassVisible;
    },

    toggleRGB() {
      const colors = [0x00f3ff, 0xbc13fe, 0xff0000, 0x00ff00];
      const currentIndex = colors.indexOf(this.rgbColor);
      this.rgbColor = colors[(currentIndex + 1) % colors.length];
      
      this.components.gpu.material.emissive.setHex(this.rgbColor);
      this.components.cooler.material.emissive.setHex(this.rgbColor);
      this.components.light.color.setHex(this.rgbColor);
    },

    onWindowResize() {
      const container = this.$refs.canvasContainer;
      if (!container) return;
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
  }
};
</script>

<style scoped>
.virtual-builder-container {
  min-height: 450px;
  background: radial-gradient(circle at center, rgba(0, 243, 255, 0.05) 0%, transparent 70%);
  position: relative;
  overflow: hidden;
}

.viewer-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.assembly-area {
  width: 100%;
  height: 380px;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.status-bar {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.4);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.scanner-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.font-mono { font-family: var(--font-mono, monospace); }
</style>

