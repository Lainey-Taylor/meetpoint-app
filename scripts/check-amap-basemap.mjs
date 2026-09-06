import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'server/meetpoint-server.mjs'), 'utf8');
const mapHandler = source.slice(source.indexOf('function sendMapHtml'), source.indexOf('async function readBody'));

if (/['"]Referrer-Policy['"]\s*:\s*['"]no-referrer['"]/.test(mapHandler)) {
  console.error('FAIL 地图页禁止发送来源信息，高德无法完成底图请求校验');
  process.exit(1);
}

if (!/['"]Referrer-Policy['"]\s*:\s*['"]strict-origin-when-cross-origin['"]/.test(mapHandler)) {
  console.error('FAIL 地图页没有使用可供高德校验且兼顾隐私的来源策略');
  process.exit(1);
}

if (!/showLabel:true/.test(mapHandler) || !/features:\['bg','road','building','point'\]/.test(mapHandler)) {
  console.error('FAIL 地图没有显式启用道路、建筑和兴趣点标签图层');
  process.exit(1);
}

console.log('PASS 地图页会向高德发送站点来源用于底图校验');
