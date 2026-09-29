import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'app/(tabs)/index.tsx'), 'utf8');
const events = source.slice(source.indexOf('  const events = ['), source.indexOf('\n  const visibleEvents'));

if (!events.includes("pathname: '/event-detail'") || !events.includes("id: 'sanlitun'") || !events.includes("id: 'wangjing'")) {
  console.error('FAIL 聚会日程卡片没有打开各自的详情页');
  process.exit(1);
}

if (events.includes('第 3 次出行') || events.includes('第 2 次出行')) {
  console.error('FAIL 聚会日程卡片仍显示出行序号');
  process.exit(1);
}

console.log('PASS 聚会日程卡片展示地点并打开对应详情页');
