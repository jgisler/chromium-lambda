const express = require('express');
const chromium = require('chrome-aws-lambda');

module.exports.handler = async (event, context) => {
   let server, client, result;
   try {
      [server, client] = await Promise.all([startServer(), startClient()]);
      let page = await client.newPage();
      await page.goto('http://localhost:3000/');
      console.log(JSON.stringify(Object.keys(page)));
      result = await page.content();
   } catch (error) {
      return context.fail(error);
   } finally {
      if (client !== null) {
         await client.close();
      }
   }

   return context.succeed(result);
};

async function startServer() {
   const app = express();
   const port = 3000;
   app.get('/', (req, res) => res.send('Hello World!'));
   app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}

async function startClient() {
   const execPath = await chromium.executablePath;
   const launchOpts = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: chromium.headless
   };
   return chromium.puppeteer.launch(launchOpts);
}

(async () => {
   try {
      const result = await this.handler({}, {});
      console.log(JSON.stringify(result, null, 2));
   } catch (error) {
      throw error;
   }
})();
