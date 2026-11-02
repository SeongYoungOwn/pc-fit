export function formatPrice(price) {
  if (!price && price !== 0) return '0원';
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}