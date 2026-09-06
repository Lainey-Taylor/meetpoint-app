import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');
const home = read('app/(tabs)/index.tsx');
const direct = read('app/(tabs)/direct.tsx');
const choose = read('app/(tabs)/choose.tsx');
const tabs = read('app/(tabs)/_layout.tsx');
const autocomplete = read('components/PlaceAutocomplete.tsx');

const checks = [
  ['首页日程筛选会更新状态', /setActiveSchedule\(/.test(home) && /onPress=.*setActiveSchedule/.test(home)],
  ['网页首页头图显式铺满内容视口', /marginHorizontal:\s*-16/.test(home) && /alignSelf:\s*'stretch'/.test(home) && !/width:\s*windowWidth/.test(home)],
  ['指定测算可添加成员', /function addParticipant|const addParticipant/.test(direct) && /onPress=\{addParticipant\}/.test(direct)],
  ['指定测算可启用交通方式', /function toggleMode|const toggleMode/.test(direct) && /onPress=.*toggleMode/.test(direct)],
  ['指定测算可编辑交通时长', /changeLimit/.test(direct) && /TextInput/.test(direct)],
  ['聚餐选址采用地图与配置分区', /<AmapMap/.test(choose) && /title="聚餐配置"/.test(choose) && /title="成员出发配置"/.test(choose)],
  ['聚餐选址使用全屏真实地图与可拖拽抽屉', /PanResponder/.test(choose) && /Animated\.View/.test(choose) && /fullMap/.test(choose)],
  ['抽屉内部具有独立滚动区', /drawerExpanded/.test(choose) && /scrollEnabled=\{drawerExpanded\}/.test(choose) && /<ScrollView/.test(choose)],
  ['测算页每位成员使用模糊地址搜索', /state\.participants\.map[\s\S]*<PlaceAutocomplete/.test(direct)],
  ['位置输入框统一使用定位图标', /leadingIcon/.test(autocomplete) && /leadingIcon="mappin\.and\.ellipse"/.test(choose) && /leadingIcon="mappin\.and\.ellipse"/.test(direct)],
  ['底栏图标与文字使用统一垂直布局', /tabEmoji/.test(tabs) && /lineHeight/.test(tabs)],
  ['首页日程图片显式铺满卡片宽度', /eventImage:\s*\{[^}]*width:\s*'100%'/.test(home) && /resizeMode="cover"/.test(home)],
];

let failed = false;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  failed ||= !passed;
}
process.exit(failed ? 1 : 0);
