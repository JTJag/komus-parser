import { gotScraping, Response } from "got-scraping";
import sha256 from "sha256";

function generateDeviceId() {
  const num = Math.floor(Math.random() * 9223372036854775807);
  return num.toString(16);
}

function formatDate(now: Date) {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayOfWeek = daysOfWeek[now.getUTCDay()];
  const dayOfMonth = String(now.getUTCDate()).padStart(2, "0");
  const month = months[now.getUTCMonth()];
  const year = now.getUTCFullYear();
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");

  const formattedDate = `${dayOfWeek}, ${dayOfMonth} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;

  return formattedDate;
}

export class komus {
  static readonly clientSecret = "KeifCifPedicDydibdoybJeygsAngon9";

  static getUidPhone(android_id?: string) {
    if (!android_id) {
      android_id = generateDeviceId();
    }
    return (
      "android:" +
      Buffer.from(sha256("com.mobile.komus" + android_id))
        .subarray(2)
        .toString("base64")
        .replace("+", "-")
        .replace("/", "_")
    );
  }

  static async auth({
    device_id,
    mobileapp,
  }: {
    device_id: string;
    mobileapp?: string;
  }) {
    try {
      let response = await gotScraping
        .post({
          url: "https://www.komus.ru/komuswebservices/oauth/token",
          searchParams: new URLSearchParams({
            grant_type: "device_id",
            client_id: "mobile",
            client_secret: "KeifCifPedicDydibdoybJeygsAngon9",
            device_id,
          }),
          headers: {
            "X-Komus-Region": "77",
            "X-Komus-Mobileapp": mobileapp || this.getUidPhone(),
            "X-Komus-Hybrisversion": "DefaultPlatformVersion",
            "X-Komus-Mobiledeviceid": device_id,
            Date: formatDate(new Date()),
            "User-Agent": "okhttp/5.0.0-alpha.11",
          },
        })
        .json();

      console.log(response);
      return response as {
        access_token: string;
        token_type: "bearer";
        refresh_token: string;
        expires_in: number;
      };
    } catch (error) {
      console.log({ error });
    }
  }
}
