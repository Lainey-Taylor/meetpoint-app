import type { Participant, RecommendationResponse, RestaurantResult, TravelMode } from '@/types/meetpoint';

export const modeLabels: Record<TravelMode, string> = {
  transit: '公交地铁',
  driving: '驾车/打车',
  walking: '步行',
  bicycling: '自行车',
  electrobike: '电动车',
};

export const initialParticipants: Participant[] = [
  {
    id: 'owner', name: '我', owner: true, address: '北京市海淀区颐和园路5号',
    modes: [{ mode: 'transit', limitMinutes: 50 }, { mode: 'driving', limitMinutes: 30 }],
  },
  {
    id: 'friend', name: '朋友', address: '北京市朝阳区惠新东街10号',
    modes: [{ mode: 'transit', limitMinutes: 50 }],
  },
];

const makePerson = (name: string, minutes: number, limit = 50, mode: TravelMode = 'transit') => ({
  name,
  feasible: minutes <= limit,
  bestOverrunSeconds: Math.max(0, minutes - limit) * 60,
  routes: [{ mode, status: 'ok' as const, displayMinutes: minutes, limitMinutes: limit, qualifies: minutes <= limit }],
});

export const demoQualified: RecommendationResponse = {
  resultType: 'qualified',
  results: [
    { id: '1', name: '弄堂里 · 精致杭帮菜', district: '朝阳区', address: '三里屯太古里北区', rating: 4.8, cost: 138, qualified: true, participantResults: [makePerson('我', 42), makePerson('朋友', 36)] },
    { id: '2', name: '潇湘小馆 · 地道湘味', district: '东城区', address: '雍和宫大街', rating: 4.7, cost: 126, qualified: true, participantResults: [makePerson('我', 39), makePerson('朋友', 45)] },
    { id: '3', name: '绿茶餐厅 · 龙井烤鸡', district: '朝阳区', address: '国贸商城', rating: 4.6, cost: null, qualified: true, participantResults: [makePerson('我', 48), makePerson('朋友', 41)], warnings: ['价格待确认'] },
  ],
};

export const demoRelaxed: RecommendationResponse = {
  resultType: 'relaxed',
  results: [
    { id: '4', name: '小大董 · 酥香烤鸭与京味', district: '朝阳区', address: '蓝色港湾', rating: 4.8, cost: 188, qualified: false, maxOverrunSeconds: 180, participantResults: [makePerson('我', 48), makePerson('朋友', 53)] },
    { id: '5', name: '隐泉日式料理 · 寿司会席', district: '朝阳区', address: '亮马桥', rating: 4.7, cost: 198, qualified: false, maxOverrunSeconds: 300, participantResults: [makePerson('我', 55), makePerson('朋友', 43)] },
  ],
};

export const demoDirectRestaurant: RestaurantResult = {
  id: 'direct-demo', name: '新荣记 · 金融街中心店', district: '西城区', address: '金融大街11号', rating: 4.8, cost: 498,
  participantResults: [],
};

