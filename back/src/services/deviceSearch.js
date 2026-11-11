function searchTokens(query) {
  let text = String(query || '').trim();
  const aliases = [['갤럭시워치', 'Galaxy Watch'], ['애플워치', 'Apple Watch'], ['갤럭시', 'Galaxy'],
    ['아이폰', 'iPhone'], ['아이패드', 'iPad'], ['맥북', 'MacBook'], ['삼성', 'Samsung'], ['애플', 'Apple'],
    ['울트라', 'Ultra'], ['워치', 'Watch'], ['플러스', '+'], ['프로', 'Pro'], ['에이수스', 'ASUS'], ['아수스', 'ASUS'], ['레노버', 'Lenovo']];
  for (const [ko, en] of aliases) text = text.split(ko).join(` ${en} `);
  return text.trim().split(/\s+/).filter(Boolean);
}
function likePattern(token) { return `%${token.replace(/[\\%_]/g, '\\$&')}%`; }
module.exports = { searchTokens, likePattern };
