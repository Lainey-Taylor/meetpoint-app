import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'services/meetpoint-api.ts'), 'utf8');
const match = source.match(/CALCULATION_TIMEOUT_MS\s*=\s*([\d_]+)/);
const timeoutMs = match ? Number(match[1].replaceAll('_', '')) : 30_000;

if (timeoutMs < 65_000) {
  console.error(`FAIL 实时餐厅计算超时为 ${timeoutMs}ms，短于高德个人版完整计算所需时间`);
  process.exit(1);
}

if (!/request<RecommendationResponse>\('\/api\/recommend',[\s\S]*?\}, CALCULATION_TIMEOUT_MS\);/.test(source)) {
  console.error('FAIL 餐厅推荐请求没有使用计算专用超时');
  process.exit(1);
}

console.log(`PASS 实时餐厅计算允许等待 ${timeoutMs}ms`);
