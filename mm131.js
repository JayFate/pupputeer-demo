// 爬取性感美女
const fs = require("fs-extra");
const path = require("path");
const puppeteer = require("puppeteer");

/* ============================================================
  wait until images to load
============================================================ */
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}


/* ============================================================
  Download All products Images in a page
============================================================ */
async function downloadFromPage(key, _url, page) {
  await page.goto(_url);
  await sleep(500)
  let innerText = ''
  let selector = "body > div > div > strong";
  try {
    innerText = await page.$eval(selector, (ele) => ele.innerText);
  } catch (error) { }
  if (innerText === '页面没有找到') {
    return
  }
  // 能走到这里就说明页面存在
  let urls = [_url]
  urls = urls.concat([...Array(50).keys()].map(i => {
    if (i > 1) {
      return _url.replace(".html", `_${i}.html`)
    }
  })).filter(Boolean)
  selector = "body > div.content > div.content-pic > a > img"
  for (const [i, url] of urls.entries()) {
    try {
      await page.goto(url);
    } catch (error) { }
    await sleep(500)
    try {
      await page.hover(selector)
      // 获取图片的 src 并存入数组中
      // const src = await page.$eval(selector, (img) => img.src);
      const img = await page.$(selector);
      const filepath = path.resolve(__dirname, `images/mm131/${key}/${i}.png`)
      fs.ensureFileSync(filepath)
      await img.screenshot({ path: filepath })
    } catch (error) {
      console.log(error)
      break
    }
  }
}

// 获取页面 url，我们只爬取性感美女
// pageUrls 是我们生成的，里面的每个URL对应的页面不一定存在
const pageUrls = [...Array(5600).keys()].filter(key => key > 554).map(key => `https://www.mm131.net/xinggan/${key}.html`).reverse();

(async () => {
  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: false, // 关闭无头浏览器模式，方便我们查看运行情况
    // 如果打开无头模式，运行会更快
    defaultViewport: {
      width: 1500,
      height: 1000
    }
  });
  // 新建页面
  const page = await browser.newPage();
  debugger
  for (const [index, url] of pageUrls.entries()) {
    await downloadFromPage(index, url, page)
  }
  await browser.close();
})();
