import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');
const home = read('app/(tabs)/index.tsx');
const choose = read('app/(tabs)/choose.tsx');
const direct = read('app/(tabs)/direct.tsx');
const results = read('app/results.tsx');
const icons = read('components/AppIcon.tsx');

const checks = [
  ['首页头图有立即显示的底色和独立本地图片层', /heroBackdrop/.test(home) && /<Image[^>]+stitch-hero/.test(home)],
  ['聚餐选址去掉真实地图状态文案', !/真实高德地图/.test(choose) && !/mapStatus/.test(choose)],
  ['聚餐选址抽屉支持展开、半开和收起三个位置', /midY/.test(choose) && /collapsedY/.test(choose) && /snapDrawer/.test(choose)],
  ['聚餐选址展开后抽屉内容可独立滚动', /scrollEnabled=\{drawerExpanded\}/.test(choose) && /nestedScrollEnabled/.test(choose)],
  ['指定测算成员可删除', /removeParticipant/.test(direct) && /xmark\.circle\.fill/.test(direct)],
  ['指定测算使用像素成员头像', /PixelAvatar/.test(direct)],
  ['未启用交通方式提示为点击开启', /点击开启/.test(direct) && !/未开启/.test(direct)],
  ['位置图标统一使用定位 emoji', /'mappin\.and\.ellipse': '📍'/.test(icons) && /mappin: '📍'/.test(icons)],
  ['结果成功标记使用视图绘制而非字体对号', /function SuccessMark/.test(results) && /checkStem/.test(results) && /checkArm/.test(results)],
];

let failed = false;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  failed ||= !passed;
}
process.exit(failed ? 1 : 0);
