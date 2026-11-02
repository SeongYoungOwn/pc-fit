function inferSocketFromName(name) {
  if (!name) return null;
  const upper = name.toUpperCase();
  if (upper.includes('AM5') || upper.includes('B650') || upper.includes('X670') || upper.includes('A620') || upper.match(/7\d{2}0/)) return 'AM5';
  if (upper.includes('AM4') || upper.includes('B550') || upper.includes('X570') || upper.includes('A520') || upper.match(/5\d{2}0/)) return 'AM4';
  if (upper.includes('LGA1700') || upper.includes('B760') || upper.includes('Z790') || upper.includes('H610') || upper.match(/1[234]\d{2}0/)) return 'LGA1700';
  if (upper.includes('LGA1200') || upper.includes('B560') || upper.includes('Z590') || upper.includes('H510') || upper.match(/1[01]\d{2}0/)) return 'LGA1200';
  return null;
}

function inferRamTypeFromName(name) {
  if (!name) return null;
  const upper = name.toUpperCase();
  if (upper.includes('DDR5')) return 'DDR5';
  if (upper.includes('DDR4')) return 'DDR4';
  return null;
}

function checkCompatibility(parts) {
  const warnings = [];

  // 안전한 파트 접근을 위한 헬퍼 (누락된 파트 대응)
  const cpu = parts.cpu || {};
  const motherboard = parts.motherboard || {};
  const ram = parts.ram || {};
  const gpu = parts.gpu || {};
  const psu = parts.psu || {};
  const cooler = parts.cooler || {};

  const cpuSocket = cpu.socket || inferSocketFromName(cpu.name);
  const mbSocket = motherboard.socket || inferSocketFromName(motherboard.name);
  const ramType = ram.type || inferRamTypeFromName(ram.name);
  const mbRamType = motherboard.ramType || inferRamTypeFromName(motherboard.name) || (mbSocket === 'AM5' ? 'DDR5' : null);

  // 규칙 1: CPU 소켓 ↔ 메인보드 소켓
  if (cpuSocket && mbSocket) {
    const cpuSockNorm = cpuSocket.replace(/\s+/g, '').toUpperCase();
    const mbSockNorm = mbSocket.replace(/\s+/g, '').toUpperCase();
    if (cpuSockNorm !== mbSockNorm) {
        warnings.push({
          type: 'socket_mismatch', severity: 'error',
          message: `CPU 소켓(${cpuSocket})과 메인보드 소켓(${mbSocket})이 일치하지 않을 수 있습니다.`,
          affectedParts: ['cpu', 'motherboard']
        });
    }
  } else if (!cpuSocket || !mbSocket) {
    warnings.push({
      type: 'socket_unknown', severity: 'warning',
      message: `CPU 또는 메인보드 소켓 정보를 정확히 확인할 수 없어 호환성 검증이 불완전합니다.`,
      affectedParts: ['cpu', 'motherboard']
    });
  }

  // 규칙 2: RAM 타입 ↔ 메인보드
  if (ramType && mbRamType) {
    const ramNorm = ramType.replace(/\s+/g, '').toUpperCase();
    const mbRamNorm = mbRamType.replace(/\s+/g, '').toUpperCase();
    if (ramNorm !== mbRamNorm) {
        warnings.push({
          type: 'ram_mismatch', severity: 'error',
          message: `RAM(${ramType})과 메인보드(${mbRamType})가 호환되지 않습니다.`,
          affectedParts: ['ram', 'motherboard']
        });
    }
  }

  // 규칙 3: 쿨러 소켓
  const coolerSocket = cooler.socket || inferSocketFromName(cooler.name);
  if (coolerSocket && cpuSocket && coolerSocket !== cpuSocket && !cooler.name?.toUpperCase().includes('멀티소켓') && !cooler.name?.toUpperCase().includes('공용')) {
    // 쿨러는 대부분 여러 소켓을 지원하므로 경고 생략 또는 추가 로직 가능
  }

  // 규칙 4: 전력량
  const totalTdp = (cpu.tdp || 65) + (gpu.tdp || 200);
  const psuWattage = psu.specs?.total_wattage || psu.total_wattage || psu.wattage || psu.specs?.wattage || 600;
  const recommendedPsu = Math.ceil(totalTdp * 1.5 / 50) * 50;

  if (psuWattage < totalTdp * 1.2) {
    warnings.push({
      type: 'psu_insufficient', severity: 'error',
      message: `파워(${psuWattage}W)가 부족할 수 있습니다. 최소 ${Math.ceil(totalTdp * 1.2)}W 필요.`,
      affectedParts: ['psu']
    });
  } else if (psuWattage < recommendedPsu) {
    warnings.push({
      type: 'psu_tight', severity: 'warning',
      message: `파워 여유가 부족합니다. ${recommendedPsu}W 이상 권장.`,
      affectedParts: ['psu']
    });
  }

  return {
    isCompatible: !warnings.some(w => w.severity === 'error'),
    warnings, totalWattage: totalTdp, recommendedPsu
  };
}
module.exports = { checkCompatibility };