// 爬取京东商品详情
const fs = require("fs-extra");
const path = require("path");
let request = require("request");
const puppeteer = require("puppeteer");

/* ============================================================
  Promise-Based Download Function
============================================================ */
const downloadImage = (src, dest, callback) => {
  request.head(src, (err, res, body) => {
    if (err) {
      console.log(err);
      return;
    }
    src &&
      request(src)
        .pipe(fs.createWriteStream(dest))
        .on("close", () => {
          callback && callback(null, dest);
        });
  });
};

/* ============================================================
  wait until images to load
============================================================ */

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}


/* ============================================================
  Download All products Images in a page
============================================================ */

async function downloadFromPage(key, url, page) {

  await page.goto(url);
  await sleep(5000)
  /**
   * 使用 [...Array().keys()] 快速产生图片元素的选择器
   * 有些选择器对应的元素是不存在于页面上的
   * 所以查找的时候需要 trycatch
   */
  const phoneImgs = [
    "#spec-list > ul > li.img-hover > img",
  ]
    .concat([...Array(10).keys()].map(i => `#spec-list > ul > li:nth-child(${i > 0 ? i : 1}) > img`));
  const detailImgs = [...Array(30).keys()].map(i => `#J-detail-content > div:nth-child(3) > img:nth-child(${i > 0 ? i : 1})`)
    .concat([...Array(30).keys()].map(i => `#J-detail-content > div:nth-child(4) > img:nth-child(${i > 0 ? i : 1})`))
    .concat([...Array(30).keys()].map(i => `#J-detail-content > div:nth-child(5) > img:nth-child(${i > 0 ? i : 1})`))
    .concat(["#J-detail-pop-tpl-top-new > div:nth-child(2) > div > img",
      "#J-detail-pop-tpl-top-new > div:nth-child(4) > div > img",]);
  let images = []
  debugger
  /**
   * 使用 for...of...循环保证内部 promise 顺序执行
   * 不可以使用 foreach 循环
   */
  for (const selector of phoneImgs) {
    try {
      await sleep(200)
      // page.hover 能自动移动页面，让 selector 对应的元素出现在视图中
      // 这样我们才能操作元素
      await page.hover(selector)
      // 获取图片的 src 并存入数组中
      const src = await page.$eval("#spec-img", (img) => img.src);
      images = images.concat(src)
    } catch (error) { }
  }
  for (const selector of detailImgs) {
    try {
      await sleep(200)
      await page.hover(selector)
      const src = await page.$eval(selector, (img) => img.src);
      images = images.concat(src)
    } catch (error) { }
  }
  // 对图片的 src 去重
  images = [...new Set(images)]
  console.log(JSON.stringify(images, null, 2))
  // 循环下载所有图片
  for (const [i, url] of images.entries()) {
    try {
      // 图片的储存位置，
      const filepath = path.resolve(__dirname, `images/jd/${key}/${i}.png`)
      // 需要先保证文件存在
      fs.ensureFileSync(filepath)
      await downloadImage(url, filepath);
      console.log(filepath)
    } catch (error) {
      console.log(error)
    }
  }

}

const pageUrls = {
  x30: "https://item.jd.com/100005755995.html",
  Neo3: "https://item.jd.com/100012820012.html",
  S6: "https://item.jd.com/100011924580.html"
};
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
  const keys = Object.keys(pageUrls)
  for (const key of keys) {
    const url = pageUrls[key]
    await downloadFromPage(key, url, page)
  }
  await browser.close();
})();
