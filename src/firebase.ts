import { gotScraping } from "got-scraping";
import * as uuid from "uuid";

const REMOVE_PREFIX_MASK = parseInt("00001111", 2);
const FID_4BIT_PREFIX = parseInt("01110000", 2);
const FID_LENGTH = 22;

export class firebase {
  static async installations({
    fid,
    appId,
    firebaseClient,
    androidCert,
    googApiKey,
    userAgent,
  }: {
    fid: string;
    appId: string;
    firebaseClient?: string;
    androidCert: string;
    googApiKey: string;
    userAgent: string;
  }) {
    const response = await gotScraping({
      url: "https://firebaseinstallations.googleapis.com/v1/projects/komus-mobile/installations",
      method: "POST",
      body: JSON.stringify({
        fid,
        appId,
        authVersion: "FIS_v2",
        sdkVersion: "a:17.1.3",
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cache-Control": "no-cache",
        "X-Android-Package": "com.mobile.komus",
        "x-firebase-client": firebaseClient,
        "X-Android-Cert": androidCert,
        "x-goog-api-key": googApiKey,
        "User-Agent": userAgent,
      },
      responseType: "text",
      retry: {
        limit: 0,
      },
    });
    return JSON.parse(response.body);
  }

  static createRandomFid() {
    // A valid FID has exactly 22 base64 characters, which is 132 bits, or 16.5 bytes.
    const uuidStr = uuid.v4();
    const uuidBytes = uuid.parse(uuidStr);
    uuidBytes[16] = uuidBytes[0];
    uuidBytes[0] = (REMOVE_PREFIX_MASK & uuidBytes[0]) | FID_4BIT_PREFIX;
    return Buffer.from(uuidBytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .slice(0, FID_LENGTH);
  }

  static parseTokenClaims(token: string) {
    if (!token) {
      throw new Error("Token must not be null");
    }

    const tokenSubSections = token.split(".", -1);

    if (tokenSubSections.length < 2) {
      console.error("Invalid token (too few subsections):\n" + token);
      return {};
    }

    const encodedToken = tokenSubSections[1];

    try {
      const decodedToken = new TextDecoder("utf-8").decode(
        new Uint8Array(Buffer.from(encodedToken, "base64"))
      );

      return decodedToken;
      //const map = parseJsonIntoMap(decodedToken);
      //return map || {};
    } catch (error) {
      console.error("Unable to decode token (charset unknown):\n" + error);
      return {};
    }
  }
}
