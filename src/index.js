const chromium = require('chrome-aws-lambda');

exports.handler = async (event, context) => {
   let result = null;
   let browser = null;

   try {
      browser = await startChromium();
      let page = await browser.newPage();
      await page.goto(event.url || 'https://example.com');
      result = await page.title();
   } catch (error) {
      return context.fail(error);
   } finally {
      if (browser !== null) {
         await browser.close();
      }
   }

   return context.succeed(result);
};

async function startChromium() {
   const execPath = await chromium.executablePath;
   const launchOpts = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: chromium.headless
   };
   return chromium.puppeteer.launch(launchOpts);
}
