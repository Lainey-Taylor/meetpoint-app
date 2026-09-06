import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'app/(tabs)/index.tsx'), 'utf8');
const handler = source.slice(source.indexOf('function continueRecentDinner'), source.indexOf('\n  return ('));

if (!handler.includes("router.push('/results')")) {
  console.error('FAIL 最近聚餐按钮没有跳转到餐厅名单');
  process.exit(1);
}

if (/await\s+recommendRestaurants|recommendRestaurants\(/.test(handler)) {
  console.error('FAIL 最近聚餐按钮会等待重新计算后才跳转');
  process.exit(1);
}

console.log('PASS 最近聚餐按钮会立即打开餐厅名单');
