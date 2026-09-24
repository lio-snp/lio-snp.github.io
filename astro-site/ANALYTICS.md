# 网站访问统计（Umami Cloud）

统计服务运行在 Umami Cloud，个人电脑无需开机。登录创建站点时使用的账号：
https://cloud.umami.is

## 查看数据

1. 在 **Websites** 中打开 **Yanlin Liu**（域名 `lio-snp.github.io`）。
2. 选择日期范围，查看浏览量、访客、页面、来源、地区、设备等。
3. **Events** 查看下面的点击事件；事件属性可以区分论文、项目或平台。
4. **Sessions** 查看匿名访问过程。这不能确定某位导师或具体个人是否来过。

| 事件 | 含义 | 属性 |
| --- | --- | --- |
| `paper_open` | 点击有外部链接的论文标题 | `paper`：论文 ID |
| `citation_open` | 点击 BibTeX | `paper`：论文 ID |
| `research_path_select` | 选择 Research Path 项目 | `project`：项目 ID |
| `profile_open` | 点击 GitHub、Google Scholar、LinkedIn 链接 | `profile`：平台 |
| `contact_email` | 点击邮件链接 | 无 |
| `cv_open` | 点击站内 CV 链接 | 无 |
| `cat_call` | 点击 Where is my cat? | 无 |

点击只表示点击，不证明访客读完论文、发送邮件或完成下载。小猫每天的自动出现不记为点击。

## 导出

在个人账号菜单进入 **Settings → Data → Export**，选择站点并提交。
Umami 会把下载链接发送到账号邮箱；数据为 gzip 压缩的 CSV，包含页面访问、事件、会话等。
需要自动拉取时，可另外接 Cloud API，API Key 必须留在私人后台，不能放入此公开仓库或网页。
定期邮件报告属于 Pro 功能；本次没有开通付费功能。

## 范围与排除

- 全站共用 `src/components/Analytics.astro`，只有生产构建且域名为 `lio-snp.github.io` 才会收集。
- 网站 ID 是公开标识，不是账号密码或 API Key。
- 开始接入后的访问才有数据，无法追溯以前的访问。
- 不记录 URL 查询参数和锚点，About / News 等页内跳转不拆成独立页面。
- 尊重浏览器 Do Not Track；广告拦截器可能阻止统计，因此数字并非全部访问的精确总数。
- Umami 不保存原始 IP，无法直接获取访客姓名、邮箱或确认个人身份。
- 要排除自己：在自己的网站浏览器控制台执行 `localStorage.setItem('umami.disabled', 1)`。
  恢复：`localStorage.removeItem('umami.disabled')`。每个浏览器分别设置。

## 维护与验证

事件监听在 `public/analytics-events.js`，使用事件委托支持动态论文卡片。
统计失败不会阻止链接、引用弹窗或小猫动作。
更新后运行 `npm test`、`npm run check`、`npm run build`。
上线后打开真实域名，在 Umami 后台确认新增访问，再点击猫按钮确认 `cat_call`。

官方文档：
- https://docs.umami.is/docs/collect-data
- https://docs.umami.is/docs/track-events
- https://docs.umami.is/docs/tracker-configuration
- https://docs.umami.is/docs/cloud/export-data
- https://docs.umami.is/docs/exclude-my-own-visits
- https://docs.umami.is/docs/metric-definitions
