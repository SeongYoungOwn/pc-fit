<template>
  <div class="particle-background-wrapper">
    <div class="bg-gradient"></div>
    <canvas ref="particleCanvas" id="particles"></canvas>
  </div>
</template>

<script>
export default {
  name: 'ParticleBackground',
  mounted() {
    this.initParticles();
  },
  beforeUnmount() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  },
  methods: {
    initParticles() {
      const canvas = this.$refs.particleCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      let particlesArray = [];
      let isPageVisible = !document.hidden;
      let lastFrameTime = 0;
      const FRAME_INTERVAL = 1000 / 24; // 24 FPS 캡핑으로 GPU 점유율 대폭 절감

      const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      setCanvasSize();

      this.handleResize = () => {
        if (this.resizeTimer) clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
          setCanvasSize();
          createParticles();
        }, 200);
      };
      window.addEventListener('resize', this.handleResize, { passive: true });

      this.handleVisibilityChange = () => {
        isPageVisible = !document.hidden;
      };
      document.addEventListener('visibilitychange', this.handleVisibilityChange);

      class Particle {
        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * 2.5 + 1;
          this.speedX = (Math.random() - 0.5) * 0.4;
          this.speedY = (Math.random() - 0.5) * 0.4;
          const opacity = (Math.random() * 0.45 + 0.25) * 0.7;
          const base = ['rgba(255, 0, 128,', 'rgba(0, 217, 255,', 'rgba(255, 255, 255,'][Math.floor(Math.random() * 3)];
          this.fillStyle = `${base}${opacity.toFixed(2)})`;
        }

        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
          if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
          ctx.fillStyle = this.fillStyle;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function createParticles() {
        particlesArray = [];
        // 기존 100개 -> 28개로 축소하여 배경 감성은 유지하면서 드로우콜 72% 절감
        const count = Math.min(28, Math.max(16, Math.floor(window.innerWidth / 65)));
        for (let i = 0; i < count; i++) {
          particlesArray.push(new Particle());
        }
      }

      const animate = (timestamp) => {
        this.animationFrameId = requestAnimationFrame(animate);
        if (!isPageVisible) return;
        if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
        lastFrameTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
          particlesArray[i].update();
          particlesArray[i].draw();
        }
      };

      createParticles();
      this.animationFrameId = requestAnimationFrame(animate);
    }
  }
};
</script>

<style scoped>
.particle-background-wrapper {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: #0a0e27;
  contain: strict;
}

.particle-background-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top left, rgba(255, 0, 128, 0.08), transparent 60%),
              radial-gradient(ellipse at bottom right, rgba(0, 217, 255, 0.08), transparent 60%);
  z-index: -3;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.015), transparent, rgba(255, 255, 255, 0.015));
  z-index: -2;
}

#particles {
  position: absolute;
  inset: 0;
  z-index: -1;
}
</style>
