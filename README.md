# My Artifact

一个收纳独立 HTML、交互图解和小工具的静态作品索引。

- 网站：<https://artifact.alterxyz.com/>
- 源码：<https://github.com/alterxyz/my-artifact>
- 博客：<https://blog.alterxyz.com/>

## 架构

**一个仓库、一个 Cloudflare Worker、多个独立页面。**

`artifacts.json` 描述作品清单。构建器生成主页，并把每份本地 HTML 发布到
`/artifacts/<slug>/`。每次整站部署，主页和所有子页一起更新；不需要为每份
HTML 创建独立的 Worker 或 Pages 项目。链接型条目也可以直接指向外部作品。

没有数据库和运行时前端框架。使用 Cloudflare Workers Static Assets 托管；
浏览器里的交互来自每份 HTML 自己的脚本。

```text
artifacts.json      作品清单
artifacts/          原始、自包含 HTML
site/               首页模板与样式
scripts/build.mjs   构建与清单验证
wrangler.jsonc      整站托管配置
dist/               自动生成，仅此目录用于发布
```

## 本地预览

```sh
bun install --frozen-lockfile
bun run setup-hooks
bun run dev
```

打开终端显示的地址（默认 `http://localhost:8787`）。

## 收录作品

将 HTML 放入 `artifacts/`，在 `artifacts.json` 添加：

```json
{
  "slug": "my-work",
  "title": "作品标题",
  "description": "一两句话介绍作品。",
  "category": "可视化",
  "format": "交互页面",
  "added": "2026-10-27",
  "file": "artifacts/my-work.html"
}
```

发布后地址为 `/artifacts/my-work/`。`slug` 用作永久链接，改标题时保留它。
外部作品将 `file` 换成完整的 `url`，两者只选一个。原 HTML 内容保持独立，
构建时仅在底部加返回索引与源码链接。

目前导入器接受自包含 HTML。图片、脚本等本地依赖需要显式扩展构建白名单，
避免复制项目根目录。清单移除条目后，旧构建会自动保留在本地忽略目录，
新发布目录不会继续带上已移除的页面。

## 检查与发布

```sh
bun run check
bun run deploy
```

`check` 构建并运行 Wrangler dry run，不访问生产环境。GitHub Actions 在
push 和 PR 时自动运行相同检查。**GitHub push 不会自动部署到 Cloudflare**；
发布由已登录 Cloudflare 的本地 Agent 执行 `bun run deploy`。

采用本地登录发布，免于为一个小型静态站维护另一套 CI 部署凭据。
登录过期时用 `bunx wrangler login` 恢复；凭据由 Wrangler 在项目外保存。
仅上传 `dist/`，忽略历史、依赖、备份和本机管理文件。

Regent 管理目录和本地记录已列入 `.gitignore`。本地 pre-push 检查还会检查
待推送的每个提交，拦截强制加入索引的管理文件及 `local/` 私有历史分支；
构建检查和 GitHub CI 也会检查 Git 跟踪文件。检查只读路径，不读取私密正文。

若自行托管此开源项目，请先修改 `wrangler.jsonc` 的 Worker 名称和域名，
以及 `site/index.html`、`scripts/build.mjs` 中的站点和源码地址，再部署到
你自己的 Cloudflare 账号。配置不包含原作者的 Cloudflare 账号标识或密钥。

回滚时先查看 `bunx wrangler versions list`，再选定版本执行
`bunx wrangler rollback <VERSION_ID>`。

Agent 操作规则见 [AGENTS.md](AGENTS.md)，`agent.md` 提供兼容入口。

## 授权与贡献

采用 **AGPL-3.0-or-later + 单独商业授权**：遵守 AGPL 即可使用（包括商业用途）；
需要其他权限时与项目维护者另行签署协议。
详情见 [LICENSING.md](LICENSING.md) 和 [LICENSE](LICENSE)。

沿用 [Y.Project](https://github.com/alterxyz/Y.Project) 的许可文本结构。
外部贡献者保留版权，在合并前按 [CONTRIBUTING.md](CONTRIBUTING.md) 手动签署
[ICLA](legal/ICLA.md)。没有额外 CLA 服务或机器人。
