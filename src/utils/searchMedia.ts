const tmdbApiBaseUrl = "https://tmdb.secant.workers.dev";
const tmdbApiVersionPath = "/api/3";

interface MediaType {
  title?: string;
  year?: string;
  season?: string;
  type?: MediaTypeType;
  doubanId?: string;
  imdbId?: string;
  tmdbId?: string;
}

enum MediaTypeType {
  MOVIE = "movie",
  TV = "tv",
}

interface DoubanSuggest {
  episode?: string;
  id?: string;
  img?: string;
  sub_title?: string;
  title?: string;
  type?: MediaTypeType;
  url?: string;
  year?: string;
}

// search media finite state machine
export default async function searchMedia(media: MediaType, state = "start") {
  switch (state) {
    case "start": {
      /* action function */
      /* transition function */
      const { doubanId, imdbId, title } = media;
      // has douban id
      if (doubanId) {
        return searchMedia(media, "parseDoubanSubject");
      }
      // no douban id, has imdb id
      else if (imdbId) {
        return searchMedia(media, "doubanSuggestImdbId");
      }
      // no douban id, no imdb id, has title
      else if (title) {
        return searchMedia(media, "tmdbSearch");
      }
      // other
      else {
        return searchMedia(media, "stop");
      }
    }
    case "doubanSuggestImdbId": {
      /* action function */
      await doubanSuggestImdbId(media);
      /* transition function */
      const { doubanId, title } = media;
      // has douban id
      if (doubanId) {
        return searchMedia(media, "parseDoubanSubject");
      }
      // no douban id, has title
      else if (title) {
        return searchMedia(media, "doubanSuggestTitle");
      }
      // other
      else {
        return searchMedia(media, "stop");
      }
    }
    case "doubanSuggestTitle": {
      /* action function */
      await doubanSuggestTitle(media);
      /* transition function */
      const { doubanId } = media;
      // has douban id
      if (doubanId) {
        return searchMedia(media, "parseDoubanSubject");
      }
      // other
      else {
        return searchMedia(media, "stop");
      }
    }
    case "tmdbSearch": {
      /* action function */
      await tmdbSearch(media);
      /* transition function */
      const { tmdbId } = media;
      // has tmdb id
      if (tmdbId) {
        return searchMedia(media, "tmdbDetails");
      }
      // no tmdb id, has title (should cover all other cases)
      else {
        return searchMedia(media, "doubanSuggestTItle");
      }
    }
    case "tmdbDetails": {
      /* action function */
      await tmdbDetails(media);
      /* transition function */
      const { imdbId } = media;
      // has imdb id
      if (imdbId) {
        return searchMedia(media, "doubanSuggestImdbId");
      }
      // no imdb id, has title (should cover all other cases)
      else {
        return searchMedia(media, "doubanSuggestTItle");
      }
    }
    case "parseDoubanSubject": {
      /* action function */
      await parseDoubanSubject(media);
      /* transition function */
      return searchMedia(media, "stop");
    }
    case "stop": {
      return media;
    }
  }
}

/* wrapper actions (media: MediaType) => Promise<void> */
async function doubanSuggestImdbId(media: MediaType): Promise<MediaType> {
  try {
    const [{ id, year }] = await doubanSuggestApi(media.imdbId);
    media.doubanId = id;
    media.year = year;
  } catch (e) {
    console.warn(e);
  }
  return media;
}

async function doubanSuggestTitle(media: MediaType): Promise<MediaType> {
  try {
    const { title, season, year } = media;
    const queryString =
      title + season
        ? (media.type = MediaTypeType.TV) && ` season ${media.season}`
        : "";
    const responses = await doubanSuggestApi(queryString);
    const respCount = responses.length;
    if (!year && respCount) {
      media.doubanId = responses[0].id;
      media.year = responses[0].year;
    } else if (respCount) {
      let minGap = Infinity;
      let minIndex = -1;
      const numYear = parseInt(year, 10);
      for (let i = 0; i < respCount; ++i) {
        const gap = Math.abs(parseInt(responses[i].year, 10) - numYear);
        if (gap === 0) {
          media.doubanId = responses[i].id;
          return;
        }
        if (gap < minGap) {
          minGap = gap;
          minIndex = i;
        }
      }
      if (minGap === 1) {
        media.doubanId = responses[minIndex].id;
      }
    }
    return;
  } catch (e) {
    console.warn(e);
  }
  return media;
}

async function tmdbSearch(media: MediaType): Promise<MediaType> {
  try {
    const { title, season, year, type } = media;
    if (
      (season && (media.type = MediaTypeType.TV)) ||
      type === MediaTypeType.TV
    ) {
      const response = await tmdbSearchApi(title, year, type);
    }
  } catch (e) {
    console.warn(e);
  }
  return media;
}

async function tmdbDetails(media: MediaType): Promise<MediaType> {
  return media;
}

async function parseDoubanSubject(media: MediaType): Promise<MediaType> {
  return media;
}

/* apis */
async function doubanSuggestApi(queryString: string): Promise<DoubanSuggest[]> {
  return new Promise((resolve, reject) =>
    GM.xmlHttpRequest({
      method: "GET",
      url: `https://movie.douban.com/j/subject_suggest?q=${queryString}`,
      headers: {
        referer: "https://movie.douban.com/",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 Edg/92.0.902.73",
        "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
        "sec-ch-ua":
          '"Chromium";v="92", " Not A;Brand";v="99", "Microsoft Edge";v="92"',
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      responseType: "json",
      onerror: () => {
        reject(new Error("[doubanSuggest] error"));
      },
      ontimeout: () => {
        reject(new Error("[doubanSuggest] time out"));
      },
      onload: ({ status, statusText, response }) => {
        if (status === 200) {
          resolve(response);
        } else {
          reject(new Error(`[doubanSuggest] ${status} ${statusText}`));
        }
      },
    })
  );
}

async function tmdbSearchApi(
  title: string,
  year?: string,
  type: MediaTypeType = MediaTypeType.MOVIE
) {
  const searchParams = new URLSearchParams();
  searchParams.set("query", title);
  if (year) {
    searchParams.set("year", year);
  }
  const targetURL = new URL(
    `${tmdbApiVersionPath}/search/${type}` + "?" + searchParams.toString(),
    tmdbApiBaseUrl
  );
  return new Promise((resolve, reject) =>
    GM.xmlHttpRequest({
      method: "GET",
      url: targetURL.toString(),
      responseType: "json",
      onerror: () => {
        reject(new Error("[tmdbSearch] error"));
      },
      ontimeout: () => {
        reject(new Error("[tmdbSearch] time out"));
      },
      onload: ({ status, statusText, response }) => {
        if (status === 200) {
          resolve(response);
        } else {
          reject(new Error(`[tmdbSearch] ${status} ${statusText}`));
        }
      },
    })
  );
}

async function tmdbDetailsApi(
  tmdbId: string,
  type: MediaTypeType = MediaTypeType.MOVIE
) {
  const targetURL = new URL(
    `${tmdbApiVersionPath}/${type}/${tmdbId}?append_to_response=external_ids`,
    tmdbApiBaseUrl
  );
  return new Promise((resolve, reject) =>
    GM.xmlHttpRequest({
      method: "GET",
      url: targetURL.toString(),
      responseType: "json",
      onerror: () => {
        reject(new Error("[tmdbDetail] error"));
      },
      ontimeout: () => {
        reject(new Error("[tmdbDetail] time out"));
      },
      onload: ({ status, statusText, response }) => {
        if (status === 200) {
          resolve(response);
        } else {
          reject(new Error(`[tmdbDetail] ${status} ${statusText}`));
        }
      },
    })
  );
}
