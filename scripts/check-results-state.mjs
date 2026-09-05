import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const choose = readFileSync(resolve(root, 'app/(tabs)/choose.tsx'), 'utf8');
const context = readFileSync(resolve(root, 'state/MeetPointContext.tsx'), 'utf8');

const checks = [
  {
    name: '接口失败时不把演示餐厅伪装成实时结果',
    pass: !choose.includes('setRecommendation(demoQualified)'),
  },
  {
    name: '结果页默认不加载无坐标的演示餐厅',
    pass: !context.includes('useState(demoQualified)'),
  },
  {
    name: '实时测算结果在 Web 页面跳转时被保存',
    pass: existsSync(resolve(root, 'state/meetpoint-session.web.ts'))
      && context.includes('saveMeetPointSession')
      && context.includes('loadMeetPointSession'),
  },
];

const failed = checks.filter(({ pass }) => !pass);
for (const check of checks) {
  console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}`);
}

if (failed.length) process.exit(1);
