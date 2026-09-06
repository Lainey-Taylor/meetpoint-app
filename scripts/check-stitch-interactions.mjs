import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');
const home = read('app/(tabs)/index.tsx');
const direct = read('app/(tabs)/direct.tsx');
const choose = read('app/(tabs)/choose.tsx');

const checks = [
  ['首页日程筛选会更新状态', /setActiveSchedule\(/.test(home) && /onPress=.*setActiveSchedule/.test(home)],
  ['网页首页头图显式适配视口宽度', /useWindowDimensions/.test(home) && /width:\s*windowWidth/.test(home)],
  ['指定测算可添加成员', /function addParticipant|const addParticipant/.test(direct) && /onPress=\{addParticipant\}/.test(direct)],
  ['指定测算可启用交通方式', /function toggleMode|const toggleMode/.test(direct) && /onPress=.*toggleMode/.test(direct)],
  ['指定测算可编辑交通时长', /changeLimit/.test(direct) && /TextInput/.test(direct)],
  ['聚餐选址采用地图与配置分区', /<AmapMap/.test(choose) && /title="聚餐配置"/.test(choose) && /title="成员出发配置"/.test(choose)],
];

let failed = false;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  failed ||= !passed;
}
process.exit(failed ? 1 : 0);
