// 站点本身只是 dist/ 里的静态文件。这个脚本只多做一件事：给个别作品一个专用子域名，
// 让子域名的根路径直接显示那一页（地址栏不变）。wrangler.jsonc 里 run_worker_first 只有根路径，
// 其余路径照常由静态文件直接回应，不经过这里。
const HOME = 'https://artifact.alterxyz.com';
const ALIASES = {
  '1120math.alterxyz.com': '/artifacts/1120math/',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const page = ALIASES[url.hostname];
    if (!page) return env.ASSETS.fetch(request);
    const response = await env.ASSETS.fetch(new Request(new URL(page, url.origin), request));
    // 页面底部「返回索引」的链接是相对路径 /，在子域名下要指回主站。
    return new HTMLRewriter()
      .on('a[href="/"]', { element(a) { a.setAttribute('href', HOME + '/'); } })
      .transform(response);
  },
};
