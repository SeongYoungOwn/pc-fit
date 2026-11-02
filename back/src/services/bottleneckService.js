/**
 * Bottleneck Calculation Service
 * Analyzes the performance balance between CPU and GPU.
 */

function calculateBottleneck(cpuScore, gpuPowerScore) {
  if (!cpuScore || !gpuPowerScore) return { score: 0, status: 'unknown' };

  // 1. 단순 점수차 계산 (0~100 기준)
  // 이상적인 밸런스: CPU 점수 ≈ GPU 점수 * 0.9 (게이밍 기준)
  const targetCpuScore = gpuPowerScore * 0.9;
  const diff = cpuScore - targetCpuScore;
  
  let percentage = 0;
  let status = 'balanced';
  let message = '';
  let color = 'success';

  if (diff < -15) {
    // CPU가 GPU를 못 따라감 (CPU Bottleneck)
    percentage = Math.min(Math.round(Math.abs(diff) * 0.4), 25); // 현실적으로 최대 25% 선으로 억제
    status = 'cpu_bottleneck';
    message = `CPU가 그래픽카드의 성능을 약 ${percentage}% 제한하고 있습니다. 더 높은 등급의 CPU를 권장합니다.`;
    color = 'error';
  } else if (diff > 30) {
    // GPU가 너무 낮음 (GPU Bottleneck / Overkill CPU)
    percentage = Math.min(Math.round(diff * 0.3), 20);
    status = 'gpu_bottleneck';
    message = `CPU 성능에 비해 그래픽카드가 낮습니다. 게이밍 성능을 높이려면 GPU 등급을 올리는 것이 효율적입니다.`;
    color = 'warning';
  } else {
    status = 'balanced';
    message = 'CPU와 GPU의 성능 밸런스가 매우 훌륭합니다. 병목 현상 걱정 없이 사용 가능합니다.';
    color = 'success';
  }

  return {
    percentage: Math.round(percentage),
    status,
    message,
    color
  };
}

module.exports = { calculateBottleneck };
