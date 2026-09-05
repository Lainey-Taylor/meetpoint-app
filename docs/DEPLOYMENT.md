# MeetPoint 零成本作品集部署指南

## 1. 创建 GitHub 仓库

1. 登录 GitHub，打开 <https://github.com/new>。
2. Repository name 填写 `meetpoint-app`。
3. Description 可填写：`按多人通勤约束筛选聚餐地点的 Expo / React Native MVP`。
4. 选择 `Public`。
5. 不勾选 README、`.gitignore` 或 License，因为本地已经存在这些文件。
6. 点击 `Create repository`。

创建后保存仓库地址：`https://github.com/Lainey-Taylor/meetpoint-app`。

## 2. 首次推送

在提交前确认 `.env.local` 被忽略，且构建产物中没有局域网地址或真实密钥。随后将本地默认分支改为 `main`，提交并推送到新仓库。

## 3. 导入 Vercel

1. 打开 <https://vercel.com/new>，使用 GitHub 登录。
2. 授权 Vercel 访问 `meetpoint-app`。
3. 点击仓库旁的 `Import`。
4. Framework Preset 选择 `Other`；其余构建配置会从 `vercel.json` 读取。
5. 在 Environment Variables 中添加：
   - `AMAP_WEB_SERVICE_KEY`
   - `AMAP_JS_KEY`
   - `AMAP_JS_SECURITY_CODE`
6. 三个变量选择 Production、Preview 和 Development 环境。
7. 不要添加 `EXPO_PUBLIC_MEETPOINT_API_URL`。
8. 点击 `Deploy`。

## 4. 配置高德域名

部署成功后复制固定 Production URL，例如 `https://meetpoint-app.vercel.app`。进入高德开放平台控制台，将该域名加入 JS API Key 的域名白名单，然后重新部署一次。

## 5. 公网验收

- 打开 `/api/health`，应返回 `ok: true`。
- 首页、聚餐选址和指定测算均能正常打开。
- 地址输入能返回真实高德联想。
- 结果页显示真实地图、成员名称和餐厅序号。
- 使用手机移动网络重复一次完整推荐。
- 刷新 `/choose`、`/direct` 和 `/results` 不应返回 404。

## 安全要求

- 不把 `.env.local`、截图中的 Key 或 Vercel 环境变量值提交到 GitHub。
- Web Service Key 只能由服务端读取。
- 高德 JS Key 会在浏览器加载地图时出现，应配合 securityJsCode 和域名白名单使用。
