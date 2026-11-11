<template>
  <a href="#device-content" class="device-skip">본문으로 이동</a>
  <v-app-bar color="surface" elevation="0" height="72" class="device-header">
    <div class="device-header-inner">
      <router-link to="/" class="device-logo" aria-label="PC-FIT 홈">PC<span>FIT</span><i></i></router-link>
      <nav aria-label="기기 서비스" class="device-navigation">
        <router-link to="/devices" :class="{ selected: $route.name === 'DeviceCatalog' }">IT 기기</router-link>
        <router-link to="/parts" :class="{ selected: $route.name === 'PartsCatalog' }">PC 부품</router-link>
        <router-link to="/devices/compare" :class="{ selected: $route.name === 'DeviceCompare' }">기기 비교</router-link>
        <router-link to="/devices/prices" :class="{ selected: $route.name === 'DevicePrices' }">가격 변동</router-link>
      </nav>
      <router-link to="/builder" class="header-build">PC 견적 <v-icon size="17">mdi-arrow-top-right</v-icon></router-link>
      <router-link :to="$store.state.auth.isAuthenticated ? '/mypage' : '/auth/login'" class="header-account" :aria-label="$store.state.auth.isAuthenticated ? '내 정보' : '로그인'"><v-icon size="23">mdi-account-outline</v-icon></router-link>
    </div>
  </v-app-bar>
</template>
<style scoped>
.device-header { border-bottom: 1px solid #e5e9ef; }
.device-header-inner { width: min(1180px, calc(100% - 64px)); margin: auto; display: flex; align-items: center; gap: 30px; }
.device-logo { display: flex; align-items: center; color: #182334; text-decoration: none; font-size: 25px; font-weight: 900; letter-spacing: -1.3px; flex-shrink: 0; }
.device-logo span { font-weight: 500; }.device-logo i { width: 7px; height: 7px; background: #2459d3; border-radius: 50%; margin: 14px 0 0 4px; }
.device-navigation { display: flex; align-items: center; gap: 26px; }
.device-navigation a { display: inline-flex; align-items: center; min-height: 72px; color: #667085; font-size: 14px; font-weight: 600; text-decoration: none; border-bottom: 3px solid transparent; padding-top: 3px; }
.device-navigation a.selected { color: #2459d3; border-bottom-color: #2459d3; }
.header-build { margin-left: auto; background: #edf2ff; padding: 12px 15px; border-radius: 9px; color: #2459d3; font-size: 13px; text-decoration: none; font-weight: 700; white-space: nowrap; }
.header-account { display: grid; place-items: center; width: 44px; height: 44px; color: #48566a; }
@media(max-width: 700px) {
  .device-header-inner { width: calc(100% - 32px); gap: 14px; }.device-logo { font-size: 21px; }
  .device-navigation { gap: 15px; flex: 1; justify-content: center; }.device-navigation a { font-size: 12px; }
  .header-build { display: none; }.header-account { width: 44px; flex-shrink: 0; }
}
@media(max-width: 370px) { .device-header-inner { gap: 8px; }.device-navigation { gap: 10px; }.device-logo { font-size: 19px; } }
@media(max-width: 420px) { .header-account { display: none; }.device-navigation { gap: 12px; }.device-navigation a { font-size: 11px; } }
</style>
