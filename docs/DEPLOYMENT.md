# MeetPoint 零成本作品集部署指南

## 1. GitHub 仓库

代码仓库：<https://github.com/Lainey-Taylor/meetpoint-app>

默认分支为 `main`。`.env.local`、依赖目录和 Web 构建产物均由 `.gitignore` 排除。

## 2. 导入 Vercel

1. 打开 <https://vercel.com/new>，使用 GitHub 登录。
2. 授权 Vercel 访问 `meetpoint-app`。
3. 点击仓库旁的 `Import`。
4. Framework Preset 选择 `Other`；其余构建配置从 `vercel.json` 读取。
5. 在 Environment Variables 中添加：
   - `AMAP_WEB_SERVICE_KEY`
   - `AMAP_JS_KEY`
   - `AMAP_JS_SECURITY_CODE`
6. 三个变量选择 Production、Preview 和 Development 环境。
7. 不要添加 `EXPO_PUBLIC_MEETPOINT_API_URL`。
8. 点击 `Deploy`。

当前公开地址：<https://meetpoint-app-mu.vercel.app/>

## 3. 配置高德域名

进入高德开放平台控制台，将 `https://meetpoint-app-mu.vercel.app` 加入 JS API Key 的域名白名单。若控制台只接受域名，则填写 `meetpoint-app-mu.vercel.app`。保存后重新打开结果页测试地图。

## 4. 公网验收

- `/api/health` 返回 `ok: true`。
- 首页、聚餐选址、指定测算和结果页均能正常打开。
- 地址输入能返回真实高德联想。
- 完整推荐能返回带坐标的真实餐厅。
- 结果页显示真实地图、成员名称和餐厅序号。
- 使用手机移动网络重复一次完整推荐。
- 刷新 `/choose`、`/direct` 和 `/results` 不返回 404。

## 安全要求

- 不把 `.env.local`、截图中的 Key 或 Vercel 环境变量值提交到 GitHub。
- Web Service Key 只能由服务端读取。
- 高德 JS Key 会在浏览器加载地图时出现，应配合 securityJsCode 和域名白名单使用。
