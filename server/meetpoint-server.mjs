import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const prototypeDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(prototypeDir, '..');
const envPaths = [
  path.join(projectRoot, '.env.local'),
  path.resolve(projectRoot, '..', '..', '.env.local'),
];
const port = Number(process.env.PORT || 4173);
const host = process.env.MEETPOINT_HOST || '0.0.0.0';

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return values;
}

const env = { ...Object.assign({}, ...envPaths.map(loadEnv)), ...process.env };
for (const name of ['AMAP_WEB_SERVICE_KEY', 'AMAP_JS_KEY', 'AMAP_JS_SECURITY_CODE']) {
  if (!env[name]) throw new Error(`${name} is missing from .env.local`);
}

let amapQueue = Promise.resolve();
let lastAmapRequestAt = 0;

function scheduleAmapRequest(operation) {
  const run = amapQueue.then(async () => {
    const waitMs = Math.max(0, 380 - (Date.now() - lastAmapRequestAt));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastAmapRequestAt = Date.now();
    return operation();
  });
  amapQueue = run.catch(() => undefined);
  return run;
}

async function amapGet(pathname, params, context) {
  context.calls += 1;
  return scheduleAmapRequest(async () => {
    const url = new URL(pathname, 'https://restapi.amap.com');
    for (const [name, value] of Object.entries({ ...params, key: env.AMAP_WEB_SERVICE_KEY })) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(name, String(value));
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(18_000) });
    if (!response.ok) throw new Error(`AMap HTTP ${response.status}`);
    const data = await response.json();
    if (String(data.status) !== '1') {
      const message = data.info || data.errdetail || 'AMap error';
      const code = data.infocode || data.errcode || 'unknown';
      const error = new Error(`${message} (${code})`);
      error.code = code;
      throw error;
    }
    return data;
  });
}

function cleanText(value, maxLength = 120) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function asString(value) {
  if (Array.isArray(value)) return value.join('');
  return cleanText(value);
}

function asNumber(value) {
  const source = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseFloat(source);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPoint(location) {
  const [lng, lat] = String(location).split(',').map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new Error('Invalid location returned by AMap');
  return { lng, lat };
}

function coercePoint(location) {
  if (location && typeof location === 'object') {
    const lng = Number(location.lng);
    const lat = Number(location.lat);
    if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
  }
  return toPoint(location);
}

function normalizeSelectedPlace(value) {
  if (!value || typeof value !== 'object' || !value.location) return null;
  let location;
  try {
    location = coercePoint(value.location);
  } catch {
    return null;
  }
  const name = cleanText(value.name, 100);
  if (!name) return null;
  return {
    id: cleanText(value.id, 80),
    name,
    address: cleanText(value.address, 160),
    district: cleanText(value.district, 100),
    adcode: cleanText(value.adcode, 12),
    citycode: cleanText(value.citycode, 12),
    location,
  };
}

function formatPoint(point) {
  return `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`;
}

function midpoint(a, b) {
  return { lng: (a.lng + b.lng) / 2, lat: (a.lat + b.lat) / 2 };
}

function distanceMeters(a, b) {
  const earthRadius = 6_371_000;
  const latitude1 = a.lat * Math.PI / 180;
  const latitude2 = b.lat * Math.PI / 180;
  const latitudeDelta = (b.lat - a.lat) * Math.PI / 180;
  const longitudeDelta = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function uniquePoints(points) {
  const found = new Map();
  for (const point of points) found.set(`${point.lng.toFixed(4)},${point.lat.toFixed(4)}`, point);
  return [...found.values()];
}

function generateSeeds(origins) {
  const center = {
    lng: origins.reduce((sum, point) => sum + point.lng, 0) / origins.length,
    lat: origins.reduce((sum, point) => sum + point.lat, 0) / origins.length,
  };
  const seeds = [center];
  for (const origin of origins) seeds.push(midpoint(origin, center));
  for (let i = 0; i < origins.length; i += 1) {
    for (let j = i + 1; j < origins.length; j += 1) seeds.push(midpoint(origins[i], origins[j]));
  }
  return { center, seeds: uniquePoints(seeds).slice(0, 8) };
}

function splitTerms(value) {
  return cleanText(value, 200)
    .split(/[，,、]/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 12);
}

const allowedModes = new Set(['transit', 'driving', 'walking', 'bicycling', 'electrobike']);

function validateInput(raw) {
  const city = cleanText(raw.city || '北京', 30);
  const date = cleanText(raw.date, 10);
  const arrivalTime = cleanText(raw.arrivalTime, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('请选择聚会日期');
  if (!/^\d{2}:\d{2}$/.test(arrivalTime)) throw new Error('请选择期望到达时间');
  if (!Array.isArray(raw.participants) || raw.participants.length < 2 || raw.participants.length > 4) {
    throw new Error('成员人数必须为 2–4 人');
  }

  const names = new Set();
  const participants = raw.participants.map((item, index) => {
    const name = cleanText(item.name, 20);
    const address = cleanText(item.address, 120);
    if (!name) throw new Error(`第 ${index + 1} 位成员缺少昵称`);
    if (names.has(name)) throw new Error('成员昵称不能重复');
    names.add(name);
    if (!address) throw new Error(`${name} 缺少地址或地标`);
    if (!Array.isArray(item.modes) || item.modes.length < 1) throw new Error(`${name} 至少选择一种交通方式`);

    const modes = item.modes.map((modeItem) => {
      const mode = cleanText(modeItem.mode, 20);
      const limitMinutes = Number(modeItem.limitMinutes);
      if (!allowedModes.has(mode)) throw new Error(`${name} 包含不支持的交通方式`);
      if (!Number.isFinite(limitMinutes) || limitMinutes < 1 || limitMinutes > 180) {
        throw new Error(`${name} 的通勤上限应为 1–180 分钟`);
      }
      return { mode, limitMinutes };
    });
    if (new Set(modes.map((item) => item.mode)).size !== modes.length) throw new Error(`${name} 的交通方式重复`);
    return { name, address, modes, selectedPlace: normalizeSelectedPlace(item.selectedPlace) };
  });

  const budgetValue = raw.filters?.budget;
  const budget = budgetValue === '' || budgetValue === undefined || budgetValue === null
    ? null
    : Number(budgetValue);
  if (budget !== null && (!Number.isFinite(budget) || budget <= 0 || budget > 5000)) {
    throw new Error('人均预算应为 1–5000 元');
  }

  const includeCuisines = splitTerms(raw.filters?.includeCuisines);
  const excludeCuisines = splitTerms(raw.filters?.excludeCuisines);
  const overlap = includeCuisines.find((term) => excludeCuisines.includes(term));
  if (overlap) throw new Error(`“${overlap}”不能同时指定和排除`);

  return {
    city,
    date,
    arrivalTime,
    participants,
    filters: { budget, includeCuisines, excludeCuisines },
  };
}

async function geocodeParticipant(participant, city, context) {
  if (participant.selectedPlace) {
    return {
      ...participant,
      location: participant.selectedPlace.location,
      formattedAddress: [participant.selectedPlace.district, participant.selectedPlace.address].filter(Boolean).join(' ') || participant.address,
      adcode: participant.selectedPlace.adcode,
      citycode: participant.selectedPlace.citycode || '010',
    };
  }
  const data = await amapGet('/v3/geocode/geo', { address: participant.address, city }, context);
  const geocode = data.geocodes?.[0];
  if (!geocode?.location) throw new Error(`无法解析 ${participant.name} 的地址`);
  return {
    ...participant,
    location: toPoint(geocode.location),
    formattedAddress: asString(geocode.formatted_address) || participant.address,
    adcode: asString(geocode.adcode),
    citycode: asString(geocode.citycode) || '010',
  };
}

function poiCuisineText(poi) {
  return [poi.name, poi.type, poi.tag].map(asString).filter(Boolean).join(' · ');
}

function normalizePoi(poi, center) {
  const location = toPoint(poi.location);
  const rating = asNumber(poi.biz_ext?.rating);
  const cost = asNumber(poi.biz_ext?.cost);
  return {
    id: cleanText(poi.id, 80),
    name: asString(poi.name) || '未命名餐厅',
    address: asString(poi.address) || '地址待确认',
    type: asString(poi.type),
    tag: asString(poi.tag),
    tel: asString(poi.tel),
    location,
    rating,
    cost,
    distanceToCenter: Math.round(distanceMeters(location, center)),
  };
}

function filterPoi(poi, filters) {
  const text = poiCuisineText(poi);
  if (filters.budget !== null && poi.cost !== null && poi.cost > filters.budget) {
    return { keep: false, reason: 'known-budget-overrun' };
  }
  if (filters.excludeCuisines.some((term) => text.includes(term))) {
    return { keep: false, reason: 'excluded-cuisine' };
  }
  if (filters.includeCuisines.length && !filters.includeCuisines.some((term) => text.includes(term))) {
    return { keep: false, reason: 'included-cuisine-mismatch' };
  }
  const warnings = [];
  if (filters.budget !== null && poi.cost === null) warnings.push('价格待确认');
  if ((filters.includeCuisines.length || filters.excludeCuisines.length) && !poi.type && !poi.tag) {
    warnings.push('菜系待确认');
  }
  if (poi.rating === null) warnings.push('暂无评分');
  return { keep: true, warnings };
}

async function searchRestaurants(seed, city, context) {
  const data = await amapGet('/v3/place/around', {
    location: formatPoint(seed),
    types: '050000',
    city,
    radius: 2500,
    offset: 20,
    page: 1,
    extensions: 'all',
    sortrule: 'weight',
  }, context);
  return data.pois || [];
}

function formatTransitDateTime(date, arrivalTime, limitMinutes) {
  const target = new Date(`${date}T${arrivalTime}:00+08:00`);
  if (Number.isNaN(target.getTime())) return {};
  const departure = new Date(target.getTime() - limitMinutes * 60_000);
  const chinaTime = new Date(departure.getTime() + 8 * 60 * 60_000);
  const year = chinaTime.getUTCFullYear();
  const month = String(chinaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(chinaTime.getUTCDate()).padStart(2, '0');
  const hour = chinaTime.getUTCHours();
  const minute = String(chinaTime.getUTCMinutes()).padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: `${hour}-${minute}` };
}

function parseRoute(data, mode) {
  if (mode === 'transit') {
    const transit = data.route?.transits?.[0];
    const durationSeconds = Number(transit?.cost?.duration || 0);
    if (!durationSeconds) throw new Error('公交路线没有返回耗时');
    return {
      durationSeconds,
      distanceMeters: Number(transit?.distance || 0),
      sourceNote: '按公交日期/时间估算',
    };
  }
  const routePath = data.route?.paths?.[0] || data.data?.paths?.[0];
  const durationSeconds = Number(routePath?.cost?.duration || routePath?.duration?.duration || routePath?.duration || 0);
  if (!durationSeconds) throw new Error('路线没有返回耗时');
  return {
    durationSeconds,
    distanceMeters: Number(routePath?.distance || 0),
    sourceNote: mode === 'driving' ? '当前路况参考' : '基础路线估算',
  };
}

async function calculateRoute(origin, destination, modeItem, participant, input, context) {
  const hasLimit = Number.isFinite(modeItem.limitMinutes);
  const transitLookbackMinutes = hasLimit ? modeItem.limitMinutes : 60;
  const common = {
    origin: formatPoint(origin),
    destination: formatPoint(destination),
    show_fields: 'cost',
  };
  let pathname;
  let params;
  if (modeItem.mode === 'driving') {
    pathname = '/v5/direction/driving';
    params = { ...common, strategy: 32 };
  } else if (modeItem.mode === 'transit') {
    pathname = '/v5/direction/transit/integrated';
    params = {
      ...common,
      city1: participant.citycode || '010',
      city2: participant.citycode || '010',
      strategy: 8,
      AlternativeRoute: 1,
      ...formatTransitDateTime(input.date, input.arrivalTime, transitLookbackMinutes),
    };
  } else {
    pathname = {
      walking: '/v5/direction/walking',
      bicycling: '/v5/direction/bicycling',
      electrobike: '/v5/direction/electrobike',
    }[modeItem.mode];
    params = common;
  }

  try {
    const data = await amapGet(pathname, params, context);
    const parsed = parseRoute(data, modeItem.mode);
    const qualifies = hasLimit ? parsed.durationSeconds <= modeItem.limitMinutes * 60 : null;
    return {
      mode: modeItem.mode,
      limitMinutes: hasLimit ? modeItem.limitMinutes : null,
      status: 'ok',
      durationSeconds: parsed.durationSeconds,
      displayMinutes: Math.ceil(parsed.durationSeconds / 60),
      distanceMeters: parsed.distanceMeters,
      qualifies,
      overrunSeconds: hasLimit ? Math.max(parsed.durationSeconds - modeItem.limitMinutes * 60, 0) : null,
      sourceNote: parsed.sourceNote,
    };
  } catch (error) {
    context.routeErrors += 1;
    return {
      mode: modeItem.mode,
      limitMinutes: hasLimit ? modeItem.limitMinutes : null,
      status: 'error',
      error: cleanText(error.message, 160),
      qualifies: hasLimit ? false : null,
      overrunSeconds: null,
    };
  }
}

async function suggestPlaces(rawQuery) {
  const city = cleanText(rawQuery.city || '北京', 30);
  const keywords = cleanText(rawQuery.keywords, 80);
  const kind = rawQuery.kind === 'restaurant' ? 'restaurant' : rawQuery.kind === 'restaurant-or-address' ? 'restaurant-or-address' : 'place';
  if (keywords.length < 2) return { suggestions: [] };
  const context = { calls: 0, routeErrors: 0 };
  const data = await amapGet('/v3/assistant/inputtips', {
    keywords,
    city,
    citylimit: true,
    datatype: 'poi',
    type: kind === 'restaurant' ? '050000' : undefined,
  }, context);
  const suggestions = (data.tips || []).flatMap((tip) => {
    if (!tip?.location || !tip?.name) return [];
    try {
      return [{
        id: cleanText(tip.id, 80),
        name: asString(tip.name),
        district: asString(tip.district),
        address: asString(tip.address),
        adcode: asString(tip.adcode),
        citycode: asString(tip.citycode),
        location: toPoint(tip.location),
      }];
    } catch {
      return [];
    }
  }).slice(0, 6);
  return { suggestions };
}

async function resolveRestaurant(rawRestaurant, city, context) {
  const selected = normalizeSelectedPlace(rawRestaurant?.selectedPlace);
  if (selected) return selected;
  const query = cleanText(rawRestaurant?.query, 100);
  if (!query) throw new Error('请输入并选择一家餐厅');
  const data = await amapGet('/v3/place/text', {
    keywords: query,
    city,
    citylimit: true,
    types: '050000',
    offset: 1,
    page: 1,
    extensions: 'all',
  }, context);
  const poi = data.pois?.[0];
  if (!poi?.location) throw new Error('没有找到这家餐厅，请换个名称试试');
  return {
    id: cleanText(poi.id, 80),
    name: asString(poi.name) || query,
    address: asString(poi.address),
    district: asString(poi.adname),
    adcode: asString(poi.adcode),
    citycode: asString(poi.citycode),
    location: toPoint(poi.location),
  };
}

async function calculateDirectRestaurant(rawInput) {
  const input = validateInput({ ...rawInput, filters: {} });
  const context = { calls: 0, routeErrors: 0 };
  const participants = [];
  for (const participant of input.participants) {
    participants.push(await geocodeParticipant(participant, input.city, context));
  }
  const restaurant = await resolveRestaurant(rawInput.restaurant, input.city, context);
  const participantResults = [];
  const modeOrder = ['transit', 'driving', 'walking', 'bicycling', 'electrobike'];
  for (const participant of participants) {
    const configuredLimits = new Map(participant.modes.map((item) => [item.mode, item.limitMinutes]));
    const routes = [];
    for (const mode of modeOrder) {
      routes.push(await calculateRoute(
        participant.location,
        restaurant.location,
        { mode, limitMinutes: configuredLimits.get(mode) ?? null },
        participant,
        input,
        context,
      ));
    }
    participantResults.push({ name: participant.name, routes });
  }
  return {
    resultType: 'direct',
    restaurant,
    participantResults,
    participants: participants.map((item) => ({
      name: item.name,
      location: item.location,
      formattedAddress: item.formattedAddress,
      modes: item.modes,
    })),
    center: restaurant.location,
    summary: { amapCalls: context.calls, routeErrors: context.routeErrors },
  };
}

async function evaluateRestaurant(poi, participants, input, context) {
  const participantResults = [];
  for (const participant of participants) {
    const routes = [];
    for (const modeItem of participant.modes) {
      routes.push(await calculateRoute(participant.location, poi.location, modeItem, participant, input, context));
    }
    const successful = routes.filter((route) => route.status === 'ok');
    const qualifying = successful.filter((route) => route.qualifies);
    const bestOverrun = successful.length
      ? Math.min(...successful.map((route) => route.overrunSeconds))
      : null;
    participantResults.push({
      name: participant.name,
      feasible: qualifying.length > 0,
      unverifiable: successful.length === 0,
      bestOverrunSeconds: bestOverrun,
      routes,
    });
  }

  const qualified = participantResults.every((item) => item.feasible);
  const unverifiable = participantResults.some((item) => item.unverifiable);
  const overrunValues = participantResults.map((item) => item.bestOverrunSeconds).filter((value) => value !== null);
  return {
    ...poi,
    qualified,
    unverifiable,
    participantResults,
    maxOverrunSeconds: overrunValues.length ? Math.max(...overrunValues) : null,
    totalOverrunSeconds: overrunValues.length ? overrunValues.reduce((sum, value) => sum + value, 0) : null,
  };
}

function compareQualified(a, b) {
  if (a.rating === null && b.rating !== null) return 1;
  if (a.rating !== null && b.rating === null) return -1;
  if (a.rating !== b.rating) return (b.rating || 0) - (a.rating || 0);
  const aWorst = candidateWorstTrip(a);
  const bWorst = candidateWorstTrip(b);
  return aWorst - bWorst || a.id.localeCompare(b.id);
}

function candidateWorstTrip(candidate) {
  const memberBestTrips = candidate.participantResults.map((item) => {
    const durations = item.routes.filter((route) => route.status === 'ok').map((route) => route.durationSeconds);
    return durations.length ? Math.min(...durations) : Number.MAX_SAFE_INTEGER;
  });
  return memberBestTrips.length ? Math.max(...memberBestTrips) : Number.MAX_SAFE_INTEGER;
}

function compareRelaxed(a, b) {
  return (a.maxOverrunSeconds ?? Number.MAX_SAFE_INTEGER) - (b.maxOverrunSeconds ?? Number.MAX_SAFE_INTEGER)
    || (a.totalOverrunSeconds ?? Number.MAX_SAFE_INTEGER) - (b.totalOverrunSeconds ?? Number.MAX_SAFE_INTEGER)
    || compareExistingRating(a, b)
    || a.id.localeCompare(b.id);
}

function compareExistingRating(a, b) {
  return (b.rating ?? -1) - (a.rating ?? -1);
}

async function recommend(rawInput) {
  const input = validateInput(rawInput);
  const context = { calls: 0, routeErrors: 0 };
  const participants = [];
  for (const participant of input.participants) {
    participants.push(await geocodeParticipant(participant, input.city, context));
  }

  const { center, seeds } = generateSeeds(participants.map((item) => item.location));
  const rawPois = new Map();
  for (const seed of seeds) {
    const items = await searchRestaurants(seed, input.city, context);
    for (const item of items) {
      if (item.id && item.location) rawPois.set(item.id, item);
    }
    if (rawPois.size >= 45) break;
  }

  const filteredOut = { budget: 0, cuisine: 0 };
  const candidates = [];
  for (const rawPoi of rawPois.values()) {
    const poi = normalizePoi(rawPoi, center);
    const decision = filterPoi(poi, input.filters);
    if (!decision.keep) {
      if (decision.reason === 'known-budget-overrun') filteredOut.budget += 1;
      else filteredOut.cuisine += 1;
      continue;
    }
    candidates.push({ ...poi, warnings: decision.warnings });
  }

  candidates.sort((a, b) => compareExistingRating(a, b) || a.distanceToCenter - b.distanceToCenter);
  const verificationPool = candidates.slice(0, 12);
  const evaluated = [];
  for (const candidate of verificationPool) {
    evaluated.push(await evaluateRestaurant(candidate, participants, input, context));
  }

  const qualified = evaluated.filter((item) => item.qualified && !item.unverifiable).sort(compareQualified);
  const relaxed = evaluated
    .filter((item) => !item.qualified && !item.unverifiable && item.maxOverrunSeconds !== null)
    .sort(compareRelaxed);
  const resultType = qualified.length ? 'qualified' : (relaxed.length ? 'relaxed' : 'unverifiable');
  const results = (qualified.length ? qualified : relaxed).slice(0, 10);

  return {
    resultType,
    results,
    participants: participants.map((item) => ({
      name: item.name,
      location: item.location,
      formattedAddress: item.formattedAddress,
      modes: item.modes,
    })),
    center,
    seeds,
    summary: {
      amapCalls: context.calls,
      routeErrors: context.routeErrors,
      seedCount: seeds.length,
      rawPoiCount: rawPois.size,
      metadataCandidateCount: candidates.length,
      verifiedCount: evaluated.length,
      qualifiedCount: qualified.length,
      relaxedCount: relaxed.length,
      filteredOut,
      limitation: '个人基础 API 多种子搜索；结果不代表穷尽全城所有餐厅。',
    },
  };
}

const HTML_TEMPLATE = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>共同可达餐厅</title>
  <style>
    :root{--ink:#17201d;--muted:#65706c;--line:#dfe5e1;--paper:#f6f7f4;--card:#fff;--brand:#176b4d;--brand2:#e5f2eb;--amber:#a65b0b;--amber2:#fff1d6;--danger:#b33a32;--shadow:0 18px 50px rgba(26,44,36,.09)}
    *{box-sizing:border-box} body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
    button,input,select{font:inherit} button{cursor:pointer}.shell{max-width:1360px;margin:auto;padding:24px}.mast{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:20px}
    .eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--brand)}h1{margin:6px 0 5px;font-size:clamp(28px,4vw,45px);line-height:1.12;letter-spacing:-.035em}.lede{color:var(--muted);max-width:760px;margin:0}
    .proto{border:1px solid #cfe4da;background:#eff8f3;color:#176b4d;border-radius:999px;padding:8px 12px;font-weight:750;white-space:nowrap}
    .walkthrough{display:flex;gap:10px;overflow:auto;padding-bottom:5px;margin-bottom:18px}.scenario{min-width:225px;text-align:left;border:1px solid var(--line);border-radius:14px;background:var(--card);padding:13px 14px;color:var(--ink)}.scenario:hover{border-color:#7eb69f}.scenario strong{display:block}.scenario span{display:block;color:var(--muted);font-size:13px;margin-top:3px}
    .grid{display:grid;grid-template-columns:minmax(360px,520px) 1fr;gap:18px;align-items:start}.panel{background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);overflow:hidden}.panel-head{padding:18px 20px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}.panel-head h2{font-size:18px;margin:0}.body{padding:18px 20px}
    .fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{display:flex;flex-direction:column;gap:6px}.field.full{grid-column:1/-1}.field label,.label{font-size:13px;font-weight:750;color:#3b4742}.input{width:100%;border:1px solid #cfd8d3;border-radius:10px;background:white;padding:10px 11px;outline:none}.input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(23,107,77,.12)}
    .section-title{display:flex;align-items:center;justify-content:space-between;margin:22px 0 10px}.section-title h3{font-size:15px;margin:0}.ghost,.primary,.secondary{border-radius:10px;padding:9px 13px;font-weight:750}.ghost{border:1px solid var(--line);background:white;color:var(--ink)}.primary{border:1px solid var(--brand);background:var(--brand);color:white}.primary:disabled{opacity:.55;cursor:wait}.secondary{border:1px solid #a8c8bb;background:var(--brand2);color:#14563f}
    .member{border:1px solid var(--line);border-radius:14px;padding:13px;margin-bottom:10px;background:#fbfcfa}.member-top{display:grid;grid-template-columns:110px 1fr auto;gap:8px;align-items:start}.remove{border:0;background:transparent;color:var(--danger);padding:6px}.modes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.mode{display:grid;grid-template-columns:auto 1fr 64px;gap:7px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:8px;background:white}.mode label{font-size:13px}.mode input[type=number]{width:58px;border:1px solid #d6ddd9;border-radius:7px;padding:5px}.unit{font-size:11px;color:var(--muted);margin-left:-4px}
    .suggest-wrap{position:relative}.suggestions{position:absolute;z-index:20;top:calc(100% + 5px);left:0;right:0;background:white;border:1px solid var(--line);border-radius:12px;box-shadow:0 14px 35px rgba(26,44,36,.16);overflow:hidden}.suggestion{display:block;width:100%;border:0;border-bottom:1px solid #edf0ee;background:white;text-align:left;padding:10px 12px;color:var(--ink)}.suggestion:last-child{border-bottom:0}.suggestion:hover,.suggestion:focus{background:#f0f7f3}.suggestion strong{display:block;color:#176b4d}.suggestion span{display:block;color:var(--muted);font-size:12px;margin-top:2px}.selected-place{font-size:11px;color:#4e665d;margin:4px 2px 0}.selected-place:empty{display:none}
    .hint{font-size:12px;color:var(--muted);margin-top:6px}.actions{display:flex;gap:10px;padding-top:18px}.actions .primary{flex:1}.direct-box{margin-top:24px;padding-top:20px;border-top:1px solid var(--line)}.direct-box h3{margin:0 0 4px;font-size:15px}.direct-box p{margin:0 0 10px;color:var(--muted);font-size:13px}.wide{width:100%;margin-top:10px}
    .status-line{padding:12px 18px;border-bottom:1px solid var(--line);background:#fbfcfa;color:var(--muted)}.status-line strong{color:var(--ink)}.progress{height:4px;background:#edf0ee}.progress i{display:block;height:100%;width:0;background:var(--brand);transition:width .3s}.progress.busy i{width:82%;animation:pulse 1.4s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:.45}50%{opacity:1}}
    .empty{padding:70px 24px;text-align:center;color:var(--muted)}.empty strong{display:block;color:var(--ink);font-size:18px;margin-bottom:5px}.result-layout{display:grid;grid-template-rows:410px auto}.map{width:100%;height:410px;background:#e7ece8}.result-summary{padding:14px 18px;border-top:1px solid var(--line);background:white}.summary-title{display:flex;align-items:center;justify-content:space-between;gap:10px}.summary-title h3{margin:0;font-size:18px}.badge{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:800;background:var(--brand2);color:var(--brand)}.badge.warn{background:var(--amber2);color:var(--amber)}.summary-note{font-size:12px;color:var(--muted);margin:4px 0 0}
    .cards{display:grid;gap:9px;margin-top:12px;max-height:520px;overflow:auto}.venue{border:1px solid var(--line);border-radius:13px;padding:13px;background:#fff;transition:.15s}.venue:hover,.venue.active{border-color:#64a68a;box-shadow:0 6px 22px rgba(23,107,77,.11)}.venue-head{display:flex;justify-content:space-between;gap:12px}.venue h4{margin:0;font-size:16px}.meta{color:var(--muted);font-size:12px;margin-top:3px}.score{font-weight:850;color:#9b5b0b;white-space:nowrap}.warnings{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.warning{font-size:11px;border-radius:999px;padding:3px 7px;background:var(--amber2);color:var(--amber)}.routes{margin-top:10px;border-top:1px dashed var(--line);padding-top:8px}.person-route{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}.person-route b{width:52px}.route-pill{font-size:11px;border-radius:7px;padding:4px 6px;background:#edf5f1;color:#285c47}.route-pill.bad{background:#fff0ed;color:#a13e32}.route-pill.neutral{background:#f1f4f2;color:#43514b}.route-pill.error{background:#f0f1f0;color:#6f7673}.map-legend{font-size:12px;color:var(--muted);margin:5px 0 0}.direct-person{border:1px solid var(--line);border-radius:13px;padding:13px;margin-top:10px}.direct-person h4{margin:0 0 8px}.direct-routes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.direct-route{border-radius:10px;background:#f2f6f3;padding:9px}.direct-route b,.direct-route span{display:block}.direct-route span{color:var(--muted);font-size:12px}.direct-route.bad{background:#fff0ed}.amap-marker-label{border:0!important;background:transparent!important}.pin{width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--brand);border:3px solid white;box-shadow:0 4px 12px #0003}.pin.person{background:#243b8a}.pin span{display:block;transform:rotate(45deg);color:white;text-align:center;font-size:10px;line-height:24px;font-weight:800}
    @media(max-width:900px){.shell{padding:15px}.mast{display:block}.proto{display:inline-block;margin-top:12px}.grid{grid-template-columns:1fr}.modes{grid-template-columns:1fr}.result-layout{grid-template-rows:340px auto}.map{height:340px}.member-top{grid-template-columns:1fr}.remove{justify-self:end}.fields{grid-template-columns:1fr}.field.full{grid-column:auto}.direct-routes{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="mast">
      <div><div class="eyebrow">共同可达餐厅</div><h1>找一家大家都方便到的餐厅</h1><p class="lede">输入每个人的出发地和可接受时长，我们帮你整理候选餐厅。</p></div>
      <div class="proto">体验版</div>
    </header>
    <nav id="walkthrough" class="walkthrough" aria-label="快速体验">
      <button class="scenario" data-scenario="happy"><strong>双人聚餐示例</strong><span>查看大家都能按时到达的餐厅</span></button>
      <button class="scenario" data-scenario="multi"><strong>多种出行方式</strong><span>加入自行车和电动车</span></button>
      <button class="scenario" data-scenario="tight"><strong>时间比较紧</strong><span>看看没有完全合适时怎么办</span></button>
    </nav>
    <div class="grid">
      <section id="control-panel" class="panel">
        <div class="panel-head"><h2>聚餐条件</h2></div>
        <div class="body">
          <div class="fields">
            <div class="field"><label for="city">城市</label><input id="city" class="input" value="北京"></div>
            <div class="field"><label for="date">聚会日期</label><input id="date" class="input" type="date"></div>
            <div class="field"><label for="arrival">期望到达时间</label><input id="arrival" class="input" type="time" value="18:30"></div>
          </div>
          <div class="section-title"><h3>成员（2–4人）</h3><button id="add-member" class="ghost" type="button">＋ 添加成员</button></div>
          <div id="members"></div>
          <div class="section-title"><h3>餐厅条件（均可不填）</h3></div>
          <div class="fields">
            <div class="field"><label for="budget">人均预算上限</label><input id="budget" class="input" type="number" min="1" placeholder="例如 150"></div>
            <div class="field"><label for="include">只看指定菜系</label><input id="include" class="input" placeholder="例如 川菜, 日料"></div>
            <div class="field full"><label for="exclude">排除菜系</label><input id="exclude" class="input" placeholder="例如 火锅, 烧烤"></div>
          </div>
          <p class="hint">价格资料缺失不会影响通勤筛选，会标记为“价格待确认”。</p>
          <div class="actions"><button id="reset" class="secondary" type="button">恢复示例</button><button id="calculate" class="primary" type="button">帮我找餐厅</button></div>
          <section class="direct-box">
            <h3>已经有想去的餐厅？</h3>
            <p>输入餐厅名称，查看每个人五种出行方式的预计时长。</p>
            <div class="suggest-wrap">
              <input id="restaurant-query" class="input" autocomplete="off" placeholder="输入餐厅名称" aria-label="指定餐厅" aria-autocomplete="list">
              <div id="restaurant-suggestions" class="suggestions" hidden></div>
            </div>
            <div id="selected-restaurant" class="selected-place"></div>
            <button id="calculate-direct" class="secondary wide" type="button">查看五种通勤时间</button>
          </section>
        </div>
      </section>
      <section class="panel" aria-live="polite">
        <div class="panel-head"><h2>结果</h2><span id="result-badge" class="badge">等待输入</span></div>
        <div id="progress" class="progress"><i></i></div>
        <div class="status-line">当前状态：<strong id="state-status">等待填写</strong></div>
        <div id="result"><div class="empty"><strong>尚未计算</strong>可以自由填写，或先载入上面的引导场景。</div></div>
      </section>
    </div>
  </main>
  <script>
    window._AMapSecurityConfig = { serviceHost: window.location.origin + '/api/amap-service' };
    window.PROTOTYPE_AMAP_KEY = '__AMAP_JS_KEY__';
  </script>
  <script>
    var MODE_LABELS = { transit:'公共交通', driving:'驾车/打车', walking:'步行', bicycling:'自行车', electrobike:'电动车' };
    var MODE_DEFAULTS = { transit:50, driving:30, walking:30, bicycling:30, electrobike:30 };
    var ALL_MODES = Object.keys(MODE_LABELS);
    var appState = { status:'idle', participants:[], result:null, activeVenue:0, selectedRestaurant:null, restaurantSuggestions:[] };
    var map = null;
    var mapOverlays = [];
    var suggestionTimers = {};
    var suggestionSerials = {};

    function escapeHtml(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function(character) {
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character];
      });
    }

    function suggestionRows(items, kind, memberIndex) {
      return items.map(function(item,index){
        var detail = [item.district,item.address].filter(Boolean).join(' · ') || '地址待确认';
        return '<button class="suggestion" type="button" data-action="select-suggestion" data-kind="' + kind + '" data-member-index="' + (memberIndex == null ? '' : memberIndex) + '" data-suggestion-index="' + index + '"><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(detail) + '</span></button>';
      }).join('');
    }

    function showMemberSuggestions(index, items) {
      var participant = appState.participants[index];
      if (!participant) return;
      participant.suggestions = items;
      var node = document.querySelector('[data-suggestions-index="' + index + '"]');
      if (!node) return;
      node.innerHTML = suggestionRows(items,'member',index);
      node.hidden = items.length === 0;
    }

    function showRestaurantSuggestions(items) {
      appState.restaurantSuggestions = items;
      var node = document.getElementById('restaurant-suggestions');
      node.innerHTML = suggestionRows(items,'restaurant',null);
      node.hidden = items.length === 0;
    }

    function requestSuggestions(kind, memberIndex, query) {
      var key = kind + ':' + (memberIndex == null ? 'restaurant' : memberIndex);
      clearTimeout(suggestionTimers[key]);
      if (String(query || '').trim().length < 2) {
        if (kind === 'member') showMemberSuggestions(memberIndex,[]);
        else showRestaurantSuggestions([]);
        return;
      }
      var serial = (suggestionSerials[key] || 0) + 1;
      suggestionSerials[key] = serial;
      suggestionTimers[key] = setTimeout(async function(){
        try {
          var params = new URLSearchParams({city:document.getElementById('city').value,keywords:query,kind:kind === 'restaurant' ? 'restaurant' : 'place'});
          var response = await fetch('/api/suggest?' + params.toString());
          var data = await response.json();
          if (!response.ok || serial !== suggestionSerials[key]) return;
          if (kind === 'member') {
            var participant = appState.participants[memberIndex];
            if (participant && participant.address === query) showMemberSuggestions(memberIndex,data.suggestions || []);
          } else if (document.getElementById('restaurant-query').value === query) {
            showRestaurantSuggestions(data.suggestions || []);
          }
        } catch {}
      },250);
    }

    function selectedPlaceText(place) {
      return place ? '已选择：' + [place.district,place.address].filter(Boolean).join(' · ') : '';
    }

    function nextSaturday() {
      var date = new Date();
      var delta = (6 - date.getDay() + 7) % 7;
      if (delta === 0) delta = 7;
      date.setDate(date.getDate() + delta);
      return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
    }

    function baseParticipants() {
      return [
        { name:'我', address:'北京大学东门', modes:[{mode:'transit',limitMinutes:50},{mode:'driving',limitMinutes:30}] },
        { name:'朋友', address:'对外经济贸易大学西门', modes:[{mode:'transit',limitMinutes:50}] }
      ];
    }

    function setFormScenario(name) {
      appState.participants = baseParticipants();
      appState.selectedRestaurant = null;
      appState.restaurantSuggestions = [];
      document.getElementById('city').value = '北京';
      document.getElementById('date').value = nextSaturday();
      document.getElementById('arrival').value = '18:30';
      document.getElementById('budget').value = '';
      document.getElementById('include').value = '';
      document.getElementById('exclude').value = '';
      document.getElementById('restaurant-query').value = '';
      document.getElementById('selected-restaurant').textContent = '';
      showRestaurantSuggestions([]);
      if (name === 'multi') {
        appState.participants[0].modes.push({mode:'bicycling',limitMinutes:35});
        appState.participants[1].modes.push({mode:'electrobike',limitMinutes:35});
      }
      if (name === 'tight') {
        appState.participants[0].modes = [{mode:'transit',limitMinutes:18}];
        appState.participants[1].modes = [{mode:'transit',limitMinutes:18}];
      }
      renderMembers();
      clearResult(name === 'tight' ? '时间较紧的示例已载入' : '示例已载入');
    }

    function renderMembers() {
      var container = document.getElementById('members');
      container.innerHTML = appState.participants.map(function(participant,index) {
        var modes = ALL_MODES.map(function(mode) {
          var selected = participant.modes.find(function(item){ return item.mode === mode; });
          return '<div class="mode"><input type="checkbox" data-action="mode" data-index="' + index + '" data-mode="' + mode + '" ' + (selected ? 'checked' : '') + ' aria-label="选择' + MODE_LABELS[mode] + '">' +
            '<label>' + MODE_LABELS[mode] + '</label>' +
            '<span><input type="number" min="1" max="180" data-action="limit" data-index="' + index + '" data-mode="' + mode + '" value="' + (selected ? selected.limitMinutes : MODE_DEFAULTS[mode]) + '" ' + (selected ? '' : 'disabled') + '><span class="unit"> 分</span></span></div>';
        }).join('');
        var selectedText = selectedPlaceText(participant.selectedPlace);
        var suggestionItems = participant.suggestions || [];
        return '<article class="member"><div class="member-top">' +
          '<input class="input" data-action="name" data-index="' + index + '" value="' + escapeHtml(participant.name) + '" aria-label="成员昵称">' +
          '<div class="suggest-wrap"><input class="input" autocomplete="off" data-action="address" data-index="' + index + '" value="' + escapeHtml(participant.address) + '" aria-label="地址或地标" aria-autocomplete="list"><div class="suggestions" data-suggestions-index="' + index + '" ' + (suggestionItems.length ? '' : 'hidden') + '>' + suggestionRows(suggestionItems,'member',index) + '</div><div class="selected-place">' + escapeHtml(selectedText) + '</div></div>' +
          (appState.participants.length > 2 ? '<button class="remove" data-action="remove" data-index="' + index + '" type="button">删除</button>' : '<span></span>') +
          '</div><div class="modes">' + modes + '</div></article>';
      }).join('');
      document.getElementById('add-member').disabled = appState.participants.length >= 4;
    }

    function setStatus(status, message) {
      appState.status = status;
      var busy = status === 'calculating';
      var labels = { idle:'空闲', calculating:'计算中', success:'完成', error:'失败' };
      document.getElementById('state-status').textContent = message || labels[status];
      document.getElementById('progress').classList.toggle('busy', busy);
      document.getElementById('control-panel').inert = busy;
      document.getElementById('walkthrough').inert = busy;
      document.getElementById('control-panel').setAttribute('aria-busy', String(busy));
    }

    function clearResult(message) {
      if (map && typeof map.destroy === 'function') map.destroy();
      map = null;
      mapOverlays = [];
      appState.result = null;
      appState.activeVenue = 0;
      var badge = document.getElementById('result-badge');
      badge.textContent = '等待计算';
      badge.className = 'badge';
      document.getElementById('result').innerHTML = '<div class="empty"><strong>等待计算</strong>填写条件后，可以找餐厅或测算指定餐厅。</div>';
      setStatus('idle', message || '条件已更新，请重新计算');
    }

    document.getElementById('members').addEventListener('input', function(event) {
      var target = event.target;
      var index = Number(target.dataset.index);
      var participant = appState.participants[index];
      if (!participant) return;
      if (target.dataset.action === 'name') participant.name = target.value;
      if (target.dataset.action === 'address') {
        participant.address = target.value;
        participant.selectedPlace = null;
        requestSuggestions('member',index,target.value);
      }
      if (target.dataset.action === 'limit') {
        var item = participant.modes.find(function(entry){ return entry.mode === target.dataset.mode; });
        if (item) item.limitMinutes = Number(target.value);
      }
      clearResult();
    });

    document.getElementById('members').addEventListener('change', function(event) {
      var target = event.target;
      if (target.dataset.action !== 'mode') return;
      var participant = appState.participants[Number(target.dataset.index)];
      var mode = target.dataset.mode;
      if (target.checked) participant.modes.push({mode:mode,limitMinutes:MODE_DEFAULTS[mode]});
      else participant.modes = participant.modes.filter(function(item){ return item.mode !== mode; });
      renderMembers();
      clearResult();
    });

    document.getElementById('members').addEventListener('click', function(event) {
      var target = event.target.closest('[data-action]');
      if (!target) return;
      if (target.dataset.action === 'select-suggestion') {
        var memberIndex = Number(target.dataset.memberIndex);
        var participant = appState.participants[memberIndex];
        var suggestion = participant && (participant.suggestions || [])[Number(target.dataset.suggestionIndex)];
        if (!suggestion) return;
        participant.address = suggestion.name;
        participant.selectedPlace = suggestion;
        participant.suggestions = [];
        renderMembers();
        clearResult('出发地已更新');
        return;
      }
      if (target.dataset.action === 'remove') {
        appState.participants.splice(Number(target.dataset.index),1);
        renderMembers();
        clearResult();
      }
    });

    document.getElementById('add-member').addEventListener('click', function() {
      if (appState.participants.length >= 4) return;
      appState.participants.push({name:'成员' + (appState.participants.length + 1),address:'',modes:[{mode:'transit',limitMinutes:50}]});
      renderMembers();
      clearResult();
    });
    document.getElementById('restaurant-query').addEventListener('input', function(event){
      appState.selectedRestaurant = null;
      document.getElementById('selected-restaurant').textContent = '';
      requestSuggestions('restaurant',null,event.target.value);
      clearResult();
    });
    document.getElementById('restaurant-suggestions').addEventListener('click', function(event){
      var target = event.target.closest('[data-action="select-suggestion"]');
      if (!target) return;
      var suggestion = appState.restaurantSuggestions[Number(target.dataset.suggestionIndex)];
      if (!suggestion) return;
      appState.selectedRestaurant = suggestion;
      document.getElementById('restaurant-query').value = suggestion.name;
      document.getElementById('selected-restaurant').textContent = selectedPlaceText(suggestion);
      showRestaurantSuggestions([]);
      clearResult('餐厅已选择');
    });
    ['city','date','arrival','budget','include','exclude'].forEach(function(id){
      document.getElementById(id).addEventListener('input', function(){
        if (id === 'city') {
          appState.participants.forEach(function(participant){ participant.selectedPlace = null; participant.suggestions = []; });
          appState.selectedRestaurant = null;
          document.getElementById('selected-restaurant').textContent = '';
          renderMembers();
        }
        clearResult();
      });
    });
    document.getElementById('reset').addEventListener('click', function(){ setFormScenario('happy'); });
    document.querySelectorAll('[data-scenario]').forEach(function(button){
      button.addEventListener('click', function(){ setFormScenario(button.dataset.scenario); });
    });

    function collectInput() {
      return {
        city:document.getElementById('city').value,
        date:document.getElementById('date').value,
        arrivalTime:document.getElementById('arrival').value,
        participants:appState.participants.map(function(participant){
          return {name:participant.name,address:participant.address,modes:participant.modes,selectedPlace:participant.selectedPlace || null};
        }),
        filters:{
          budget:document.getElementById('budget').value,
          includeCuisines:document.getElementById('include').value,
          excludeCuisines:document.getElementById('exclude').value
        }
      };
    }

    function collectDirectInput() {
      var input = collectInput();
      input.restaurant = {
        query:document.getElementById('restaurant-query').value,
        selectedPlace:appState.selectedRestaurant
      };
      return input;
    }

    function modePill(route) {
      if (route.status === 'error') return '<span class="route-pill error">' + MODE_LABELS[route.mode] + ' 无法验证</span>';
      var className = route.qualifies ? 'route-pill' : 'route-pill bad';
      return '<span class="' + className + '">' + MODE_LABELS[route.mode] + ' ' + route.displayMinutes + '/' + route.limitMinutes + '分' + (route.mode === 'driving' ? ' · 当前路况参考' : '') + '</span>';
    }

    function venueCard(venue, index, resultType) {
      var status = resultType === 'qualified'
        ? '<span class="badge">都能按时到达</span>'
        : '<span class="badge warn">最多超时 ' + Math.ceil((venue.maxOverrunSeconds || 0)/60) + ' 分</span>';
      var rating = venue.rating == null ? '暂无评分' : '★ ' + venue.rating;
      var price = venue.cost == null ? '价格待确认' : '¥' + Math.round(venue.cost) + '/人';
      var warnings = (venue.warnings || []).map(function(item){ return '<span class="warning">' + escapeHtml(item) + '</span>'; }).join('');
      var routes = venue.participantResults.map(function(person){
        return '<div class="person-route"><b>' + escapeHtml(person.name) + '</b>' + person.routes.map(modePill).join('') + '</div>';
      }).join('');
      return '<article class="venue ' + (index === appState.activeVenue ? 'active' : '') + '" data-venue="' + index + '">' +
        '<div class="venue-head"><div><h4>' + (index + 1) + '. ' + escapeHtml(venue.name) + '</h4><div class="meta">' + escapeHtml(venue.type || venue.address) + ' · ' + price + '</div></div><div><div class="score">' + rating + '</div>' + status + '</div></div>' +
        (warnings ? '<div class="warnings">' + warnings + '</div>' : '') + '<div class="routes">' + routes + '</div></article>';
    }

    function renderResult(data) {
      appState.result = data;
      appState.activeVenue = 0;
      var isQualified = data.resultType === 'qualified';
      var title = isQualified ? '找到 ' + data.results.length + ' 家大家都能按时到达的餐厅' : (data.resultType === 'relaxed' ? '没有完全合适的餐厅，先看看最接近的选择' : '暂时没有算出可用结果');
      var badge = document.getElementById('result-badge');
      badge.textContent = isQualified ? '都能按时到达' : (data.resultType === 'relaxed' ? '有人会超时' : '请重试');
      badge.className = isQualified ? 'badge' : 'badge warn';
      if (!data.results.length) {
        document.getElementById('result').innerHTML = '<div class="empty"><strong>' + title + '</strong>请检查路线错误或修改条件后重试。</div>';
        return;
      }
      var cards = data.results.map(function(venue,index){ return venueCard(venue,index,data.resultType); }).join('');
      document.getElementById('result').innerHTML = '<div class="result-layout"><div id="map" class="map"></div><div class="result-summary"><div class="summary-title"><h3>' + title + '</h3></div><p class="map-legend">地图上 A–D 是成员，1–10 是餐厅。</p><div id="cards" class="cards">' + cards + '</div></div></div>';
      document.querySelectorAll('[data-venue]').forEach(function(card){
        card.addEventListener('click', function(){ activateVenue(Number(card.dataset.venue)); });
      });
      drawMap(data);
    }

    function directRouteCard(route) {
      if (route.status === 'error') return '<div class="direct-route"><b>' + MODE_LABELS[route.mode] + '</b><span>暂时无法计算</span></div>';
      var className = route.qualifies === false ? 'direct-route bad' : 'direct-route';
      var limitText = route.limitMinutes == null ? '未设置上限' : (route.qualifies ? '符合 ' + route.limitMinutes + ' 分钟上限' : '超过 ' + route.limitMinutes + ' 分钟上限');
      var drivingNote = route.mode === 'driving' ? ' · 当前路况参考' : '';
      return '<div class="' + className + '"><b>' + MODE_LABELS[route.mode] + ' · ' + route.displayMinutes + ' 分钟</b><span>' + limitText + drivingNote + '</span></div>';
    }

    function renderDirectResult(data) {
      appState.result = data;
      var cards = data.participantResults.map(function(person,index){
        return '<section class="direct-person"><h4>' + String.fromCharCode(65 + index) + ' · ' + escapeHtml(person.name) + '</h4><div class="direct-routes">' + person.routes.map(directRouteCard).join('') + '</div></section>';
      }).join('');
      document.getElementById('result-badge').textContent = '五种方式';
      document.getElementById('result-badge').className = 'badge';
      document.getElementById('result').innerHTML = '<div class="result-layout"><div id="map" class="map"></div><div class="result-summary"><div class="summary-title"><h3>' + escapeHtml(data.restaurant.name) + '</h3></div><p class="meta">' + escapeHtml([data.restaurant.district,data.restaurant.address].filter(Boolean).join(' · ')) + '</p><p class="map-legend">地图上 A–D 是成员，1 是这家餐厅。</p>' + cards + '</div></div>';
      drawMap(data);
    }

    function activateVenue(index) {
      appState.activeVenue = index;
      document.querySelectorAll('[data-venue]').forEach(function(card){ card.classList.toggle('active', Number(card.dataset.venue) === index); });
      var venue = appState.result && appState.result.results[index];
      if (map && venue) map.setZoomAndCenter(14,[venue.location.lng,venue.location.lat]);
    }

    function loadMap() {
      if (window.AMap) return Promise.resolve(window.AMap);
      return new Promise(function(resolve,reject){
        var script = document.createElement('script');
        script.src = 'https://webapi.amap.com/maps?v=2.0&key=' + encodeURIComponent(window.PROTOTYPE_AMAP_KEY);
        script.onload = function(){ resolve(window.AMap); };
        script.onerror = function(){ reject(new Error('地图脚本加载失败')); };
        document.head.appendChild(script);
      });
    }

    async function drawMap(data) {
      try {
        var AMapApi = await loadMap();
        map = new AMapApi.Map('map',{zoom:11,center:[data.center.lng,data.center.lat],viewMode:'2D'});
        mapOverlays = [];
        data.participants.forEach(function(person,index){
          var marker = new AMapApi.Marker({position:[person.location.lng,person.location.lat],title:person.name,content:'<div class="pin person"><span>' + String.fromCharCode(65 + index) + '</span></div>',offset:new AMapApi.Pixel(-15,-28)});
          map.add(marker); mapOverlays.push(marker);
        });
        var restaurants = data.resultType === 'direct' ? [data.restaurant] : data.results;
        restaurants.forEach(function(venue,index){
          var marker = new AMapApi.Marker({position:[venue.location.lng,venue.location.lat],title:venue.name,content:'<div class="pin"><span>' + (index+1) + '</span></div>',offset:new AMapApi.Pixel(-15,-28)});
          if (data.resultType !== 'direct') marker.on('click',function(){ activateVenue(index); });
          map.add(marker); mapOverlays.push(marker);
        });
        map.setFitView(mapOverlays,false,[45,45,45,45],13);
      } catch (error) {
        var mapNode = document.getElementById('map');
        if (mapNode) mapNode.innerHTML = '<div class="empty"><strong>地图未加载</strong>' + escapeHtml(error.message) + '；清单仍可使用。</div>';
      }
    }

    document.getElementById('calculate').addEventListener('click', async function(){
      setStatus('calculating','正在寻找合适的餐厅');
      document.getElementById('result-badge').textContent = '寻找中';
      document.getElementById('result').innerHTML = '<div class="empty"><strong>正在比较餐厅</strong>会根据每个人的出发地和通勤上限逐一确认。</div>';
      try {
        var response = await fetch('/api/recommend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(collectInput())});
        var data = await response.json();
        if (!response.ok) throw new Error(data.error || '计算失败');
        renderResult(data);
        setStatus('success','餐厅清单已生成');
      } catch (error) {
        setStatus('error',error.message);
        document.getElementById('result-badge').textContent = '失败';
        document.getElementById('result-badge').className = 'badge warn';
        document.getElementById('result').innerHTML = '<div class="empty"><strong>这次没有算完</strong>' + escapeHtml(error.message) + '</div>';
      }
    });

    document.getElementById('calculate-direct').addEventListener('click', async function(){
      setStatus('calculating','正在计算五种通勤时间');
      document.getElementById('result-badge').textContent = '计算中';
      document.getElementById('result').innerHTML = '<div class="empty"><strong>正在计算路线</strong>会为每位成员比较公共交通、驾车、步行、自行车和电动车。</div>';
      try {
        var response = await fetch('/api/restaurant-commute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(collectDirectInput())});
        var data = await response.json();
        if (!response.ok) throw new Error(data.error || '计算失败');
        renderDirectResult(data);
        setStatus('success','五种通勤时间已生成');
      } catch (error) {
        setStatus('error',error.message);
        document.getElementById('result-badge').textContent = '失败';
        document.getElementById('result-badge').className = 'badge warn';
        document.getElementById('result').innerHTML = '<div class="empty"><strong>这次没有算完</strong>' + escapeHtml(error.message) + '</div>';
      }
    });

    setFormScenario('happy');
  </script>
</body>
</html>`;

function redactSecrets(message) {
  let result = String(message || 'Unknown error');
  for (const secret of [env.AMAP_WEB_SERVICE_KEY, env.AMAP_JS_KEY, env.AMAP_JS_SECURITY_CODE]) {
    if (secret) result = result.split(secret).join('[redacted]');
  }
  return result;
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function sendHtml(response) {
  const safeJsKey = env.AMAP_JS_KEY.replace(/[\\']/g, (character) => `\\${character}`);
  const body = HTML_TEMPLATE.replace('__AMAP_JS_KEY__', safeJsKey);
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  response.end(body);
}

function sendMapHtml(response, requestUrl) {
  const raw = requestUrl.searchParams.get('data') || '{}';
  if (Buffer.byteLength(raw) > 16_000) throw new Error('地图数据过大');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('地图数据无效');
  }
  const normalizePoints = (items, limit) => (Array.isArray(items) ? items : []).slice(0, limit).flatMap((item) => {
    const lng = Number(item?.location?.lng);
    const lat = Number(item?.location?.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) return [];
    return [{ label: cleanText(item.label, 24) || '未命名', location: { lng, lat } }];
  });
  const data = {
    members: normalizePoints(parsed.members, 4),
    restaurants: normalizePoints(parsed.restaurants, 10),
  };
  const safeData = JSON.stringify(data).replace(/[<>&]/g, (character) => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026' }[character]));
  const safeJsKey = encodeURIComponent(env.AMAP_JS_KEY);
  const body = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body,#map{width:100%;height:100%;margin:0;overflow:hidden}.pin{min-width:24px;height:24px;padding:0 7px;border-radius:13px;background:#C86D44;color:#fff;border:2px solid #fff;box-shadow:0 3px 10px #0004;display:flex;align-items:center;justify-content:center;font:700 11px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;white-space:nowrap}.pin.member{background:#3167C6}.error{height:100%;display:flex;align-items:center;justify-content:center;color:#697386;font:13px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;background:#f2f3f7}</style>
<script>window._AMapSecurityConfig={serviceHost:location.origin+'/api/amap-service'};window.__MAP_DATA__=${safeData};</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=${safeJsKey}"></script></head>
<body><div id="map"></div><script>
(function(){try{var data=window.__MAP_DATA__;var all=data.members.concat(data.restaurants);var center=all.length?[all[0].location.lng,all[0].location.lat]:[116.397428,39.90923];var map=new AMap.Map('map',{zoom:11,center:center,viewMode:'2D',mapStyle:'amap://styles/normal'});var overlays=[];function add(item,label,member){var node=document.createElement('div');node.className='pin'+(member?' member':'');node.textContent=label;var marker=new AMap.Marker({position:[item.location.lng,item.location.lat],title:item.label,content:node,offset:new AMap.Pixel(-14,-26)});map.add(marker);overlays.push(marker)}data.members.forEach(function(item){add(item,item.label,true)});data.restaurants.forEach(function(item,index){add(item,String(index+1),false)});if(overlays.length)map.setFitView(overlays,false,[34,34,34,34],14)}catch(error){document.getElementById('map').innerHTML='<div class="error">高德地图暂时无法加载</div>'}})();
</script></body></html>`;
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  response.end(body);
}

async function readBody(request, limitBytes = 128_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limitBytes) throw new Error('请求数据过大');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(request) {
  const body = await readBody(request);
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    throw new Error('请求不是有效 JSON');
  }
}

async function proxyAmapService(request, response, requestUrl) {
  const upstreamPath = requestUrl.pathname.slice('/api/amap-service'.length) || '/';
  const upstreamOrigin = upstreamPath.startsWith('/v4/map/styles')
    ? 'https://webapi.amap.com'
    : 'https://restapi.amap.com';
  const upstreamUrl = new URL(upstreamPath, upstreamOrigin);
  for (const [name, value] of requestUrl.searchParams) upstreamUrl.searchParams.append(name, value);
  upstreamUrl.searchParams.set('jscode', env.AMAP_JS_SECURITY_CODE);

  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await readBody(request);
  const upstreamResponse = await scheduleAmapRequest(() => fetch(upstreamUrl, {
    method: request.method,
    body,
    headers: body ? { 'Content-Type': request.headers['content-type'] || 'application/octet-stream' } : undefined,
    signal: AbortSignal.timeout(18_000),
  }));
  const content = Buffer.from(await upstreamResponse.arrayBuffer());
  response.writeHead(upstreamResponse.status, {
    'Content-Type': upstreamResponse.headers.get('content-type') || 'application/octet-stream',
    'Content-Length': content.length,
    'Cache-Control': 'no-store',
  });
  response.end(content);
}

export async function handleRequest(request, response) {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || `${host}:${port}`}`);
  try {
    const origin = String(request.headers.origin || '');
    if (/^http:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(:\d+)?$/.test(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/') {
      sendHtml(response);
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
      sendJson(response, 200, {
        ok: true,
        credentials: { webService: true, jsApi: true, securityCode: true },
        dataSource: 'Amap personal developer basic APIs',
      });
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/map') {
      sendMapHtml(response, requestUrl);
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/suggest') {
      const result = await suggestPlaces({
        city: requestUrl.searchParams.get('city'),
        keywords: requestUrl.searchParams.get('keywords'),
        kind: requestUrl.searchParams.get('kind'),
      });
      sendJson(response, 200, result);
      return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/recommend') {
      const input = await readJson(request);
      const result = await recommend(input);
      sendJson(response, 200, result);
      return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/restaurant-commute') {
      const input = await readJson(request);
      const result = await calculateDirectRestaurant(input);
      sendJson(response, 200, result);
      return;
    }
    if (requestUrl.pathname.startsWith('/api/amap-service/')) {
      await proxyAmapService(request, response, requestUrl);
      return;
    }
    if (requestUrl.pathname === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    const message = redactSecrets(error.message);
    console.error(`[meetpoint] ${request.method} ${requestUrl.pathname}: ${message}`);
    sendJson(response, 400, { error: message });
  }
}

const isMainModule = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const server = http.createServer(handleRequest);
  server.listen(port, host, () => {
    console.log('MeetPoint AMap API server');
    console.log(`Open http://${host}:${port}`);
    console.log('Credentials loaded locally. Secret values are not logged.');
    console.log('Press Ctrl+C to stop.');
  });
  process.on('SIGINT', () => server.close(() => process.exit(0)));
}
