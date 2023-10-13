// For more information, see https://crawlee.dev/
import { HttpCrawler, ProxyConfiguration, downloadListOfUrls } from "crawlee";

import { komus } from "./komus.js";
import { readFileSync, writeFileSync } from "fs";

let sessions = JSON.parse(readFileSync("./sessions.json").toString());
let last_session = 0;

const sitemapsLinks = await downloadListOfUrls({
  url: "https://www.komus.ru/sitemap.xml",
});

const linksArray = await Promise.all(
  sitemapsLinks.map((url) => downloadListOfUrls({ url }))
);

const ids = linksArray
  .flat()
  .filter((e) => e.match(/komus.ru\/.+\/p\/\d+\//))
  .map((e) => e.match(/(?<=\/p\/)\d+(?=\/)/)?.toString())
  .map((e) => Number(e));

const chunks = ids.reduce(
  (acc, current) => {
    const lastIndex = acc.length - 1;
    if (acc[lastIndex].length < 16) {
      acc[lastIndex].push(current);
    } else {
      acc.push([current]);
    }
    return acc;
  },
  [[]] as number[][]
);

const urls = chunks.map(
  (e) =>
    "https://www.komus.ru/komuswebservices/v1/komus/product/?code=" +
    e.join(",")
);

console.log(`Количество ссылок`, urls.length);

process.on("exit", exitHandler);

process.on("SIGINT", exitHandler);

function exitHandler() {
  writeFileSync("./sessions.json", JSON.stringify(sessions, null, 4));
}

const crawler = new HttpCrawler({
  // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
  useSessionPool: true,
  persistCookiesPerSession: true,
  maxRequestsPerMinute: 20,
  maxConcurrency: 2,
  maxRequestRetries: 0,
  // Перед отправкой запроса
  preNavigationHooks: [
    async (crawlingContext, gotOptions) => {
      const { session } = crawlingContext;
      if (!session) return;

      const state = session.getState();
      const userData: any = state.userData;

      if (!userData.refresh_token) {
        let mobileapp = sessions[last_session].mobileapp || komus.getUidPhone();
        sessions[last_session].mobileapp = mobileapp;
        let device_id = sessions[last_session].device_id;
        let access_token = sessions[last_session].access_token;
        let refresh_token = sessions[last_session].refresh_token;
        if (!access_token || !refresh_token) {
          const auth_data = await komus.auth({ device_id, mobileapp });
          if (!auth_data) return;
          sessions[last_session].access_token = auth_data.access_token;
          sessions[last_session].refresh_token = auth_data.refresh_token;
        }
        userData.mobileapp = mobileapp;
        userData.device_id = device_id;
        userData.access_token = access_token;
        userData.refresh_token = refresh_token;
        last_session++;
        if (last_session >= sessions.length) {
          last_session = 0;
        }
      }

      gotOptions.headers = {
        "X-Komus-Region": "77",
        "X-Komus-Mobileapp": userData.mobileapp,
        "X-Komus-Hybrisversion": "DefaultPlatformVersion",
        "X-Komus-Mobiledeviceid": userData.device_id,
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `bearer ${userData.access_token}`,
        "User-Agent": "okhttp/5.0.0-alpha.11",
      };
    },
  ],
  // Обработка ответа
  requestHandler: async ({ pushData, request, body, response, log }) => {
    const data = JSON.parse(body.toString());
    await pushData(data);
  },
  errorHandler: async ({ context, request, response, session }, error) => {
    console.log({ request: response.request.options });
  },
});

await crawler.run(urls);
