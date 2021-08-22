const tmdbApiBaseUrl = "https://tmdb.secant.workers.dev";
const tmdbApiVersionPath = "/api/3";
import tmdbGenresMap from "../maps/tmdb-genre-map.json";

interface MediaObj {
  title?: string;
  originalTitle?: string;
  alternativeTitles?: {
    iso_3166_1?: string;
    title?: string;
    type?: string;
  }[];
  year?: string;
  season?: string;
  type?: TmdbMediaType;
  doubanId?: string;
  imdbId?: string;
  tmdbId?: string;
  genres?: string[];
}

enum TmdbMediaType {
  MOVIE = "movie",
  TV = "tv",
}

interface DoubanSuggest {
  episode?: string;
  id?: string;
  img?: string;
  sub_title?: string;
  title?: string;
  type?: TmdbMediaType;
  url?: string;
  year?: string;
}

interface TmdbMovieListResultObject {
  poster_path?: string | null;
  adult?: boolean;
  overview?: string;
  release_date?: string;
  genre_ids?: number[];
  id?: number;
  original_title?: string;
  original_language?: string;
  title?: string;
  backdrop_path?: string | null;
  popularity?: number;
  vote_count?: number;
  video?: boolean;
  vote_average?: number;
}

interface TmdbTvListResultObject {
  poster_path?: string | null;
  popularity?: number;
  id?: number;
  backdrop_path?: string | null;
  vote_average?: number;
  overview?: string;
  first_air_date?: string;
  origin_country?: string[];
  genre_ids?: number[];
  original_language?: string;
  vote_count?: number;
  name?: string;
  original_name?: string;
}

interface TmdbSearchMovie {
  page?: number;
  results?: TmdbMovieListResultObject[];
  total_results?: number;
  total_pages?: number;
}

interface TmdbSearchTv {
  page?: number;
  results?: TmdbTvListResultObject[];
  total_results?: number;
  total_pages?: number;
}

interface TmdbMovieDetails {
  adult?: boolean;
  backdrop_path?: string | null;
  belongs_to_collection?: null | object;
  budget?: number;
  external_ids?: TmdbExternalMovieIds;
  genres?: {
    id: number;
    name: string;
  }[];
  homepage?: string | null;
  id?: number;
  imdb_id?: string | null;
  original_language?: string;
  original_title?: string;
  overview?: string | null;
  popularity?: number;
  poster_path?: string | null;
  production_companies?: {
    name?: string;
    id?: number;
    logo_path?: string | null;
    origin_country?: string;
  }[];
  production_countries?: {
    iso_3166_1?: string;
    name?: string;
  }[];
  release_date?: string;
  revenue?: number;
  runtime?: number;
  spoken_languages?: {
    iso_639_1?: string;
    name: string;
  }[];
  status?:
    | "Rumored"
    | "Planned"
    | "In Production"
    | "Post Production"
    | "Released"
    | "Canceled";
  tagline?: string | null;
  title?: string;
  video?: boolean;
  vote_average?: number;
  vote_count?: number;
}

interface TmdbTvDetails {
  backdrop_path: string | null;
  created_by?: {
    id?: number;
    credit_id?: string;
    name?: string;
    gender?: number;
    profile_path?: string | null;
  }[];
  episode_run_time?: number[];
  external_ids?: TmdbExternalTvIds;
  first_air_date?: string;
  genres?: {
    id?: number;
    name?: string;
  }[];
  homepage?: string;
  id?: number;
  in_production?: boolean;
  languages?: string[];
  last_air_date?: string;
  last_episode_to_air?: {
    air_date?: string;
    episode_number?: number;
    id?: number;
    name?: string;
    overview?: string;
    production_code?: string;
    season_number?: number;
    still_path?: string | null;
    vote_average?: number;
    vote_count?: number;
  }[];
  name?: string;
  next_episode_to_air?: null;
  networks?: {
    name?: string;
    id?: number;
    logo_path?: string | null;
    origin_country?: string;
  }[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  origin_country?: string[];
  original_language?: string;
  original_name?: string;
  overview?: string;
  popularity?: number;
  poster_path?: string | null;
  production_companies?: {
    id?: number;
    logo_path?: null | string;
    name?: string;
    origin_country?: string;
  }[];
  production_countries?: {
    iso_3166_1?: string;
    name?: string;
  }[];
  seasons?: {
    air_date?: string;
    episode_count?: number;
    id?: number;
    name?: string;
    overview?: string;
    poster_path?: string;
    season_number?: number;
  }[];
  spoken_languages?: {
    english_name?: string;
    iso_639_1?: string;
    name?: string;
  }[];
  status?: string;
  tagline?: string;
  type?: string;
  vote_average?: number;
  vote_count?: number;
}

interface TmdbExternalMovieIds {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  id?: number;
}

interface TmdbExternalTvIds {
  imdb_id?: string | null;
  freebase_mid?: string | null;
  freebase_id?: string | null;
  tvdb_id?: number | null;
  tvrage_id?: number | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  id?: number;
}

interface TmdbAlternativeTitles {
  id?: number;
  titles?: {
    iso_3166_1?: string;
    title?: string;
    type?: string;
  }[];
}

const searchMediaTransition = new WeakMap();

searchMediaTransition
  .set(start, ({ doubanId, imdbId, title }: MediaObj) => {
    // has douban id
    if (doubanId) {
      return parseDoubanSubject;
    }
    // no douban id, has imdb id
    else if (imdbId) {
      return doubanSuggestImdbId;
    }
    // no douban id, no imdb id, has title
    else if (title) {
      return tmdbSearch;
    }
    // other
    else {
      return complete;
    }
  })
  .set(doubanSuggestImdbId, ({ doubanId, title }: MediaObj) => {
    // has douban id
    if (doubanId) {
      return parseDoubanSubject;
    }
    // no douban id, has title
    else if (title) {
      return doubanSuggestTitle;
    }
    // other
    else {
      return complete;
    }
  })
  .set(doubanSuggestTitle, ({ doubanId }: MediaObj) => {
    // has douban id
    if (doubanId) {
      return parseDoubanSubject;
    }
    // other
    else {
      return complete;
    }
  })
  .set(tmdbSearch, ({ tmdbId }: MediaObj) => {
    // has tmdb id
    if (tmdbId) {
      return tmdbDetails;
    }
    // no tmdb id, has title (should cover all other cases)
    else {
      return doubanSuggestTitle;
    }
  })
  .set(tmdbDetails, ({ imdbId }: MediaObj) => {
    // has imdb id
    if (imdbId) {
      return doubanSuggestImdbId;
    }
    // no imdb id, has title (should cover all other cases)
    else {
      return doubanSuggestTitle;
    }
  })
  .set(parseDoubanSubject, (media: MediaObj) => {
    return complete;
  });

export default async function searchMedia(
  media: MediaObj,
  state = start
): Promise<MediaObj> {
  if (state === complete) {
    return media;
  } else {
    try {
      await state(media);
    } catch (e) {
      console.warn(e);
    }
    return searchMedia(media, searchMediaTransition.get(state)(media));
  }
}

/* wrapper actions (media: MediaType) => Promise<void> */

async function start(media: MediaObj): Promise<MediaObj> {
  return media;
}

async function doubanSuggestImdbId(media: MediaObj): Promise<MediaObj> {
  const [{ id, year }] = await doubanSuggestApi(media.imdbId);
  media.doubanId = id;
  media.year = year;
  return media;
}

async function doubanSuggestTitle(media: MediaObj): Promise<MediaObj> {
  const { title, season, year } = media;
  const queryString =
    title +
    (season
      ? (media.type = TmdbMediaType.TV) && ` season ${media.season}`
      : "");
  const responses = await doubanSuggestApi(queryString);
  const respCount = responses.length;
  responses.sort(
    (r1, r2) =>
      Math.min(rankTitle(r1.sub_title, title), rankTitle(r1.title, title)) -
      Math.min(rankTitle(r2.sub_title, title), rankTitle(r2.title, title))
  );
  if (!year && respCount) {
    media.doubanId = responses[0].id;
    media.year = responses[0].year;
  } else if (respCount) {
    const response = responses.find(
      (r) => Math.abs(parseInt(r.year, 10) - parseInt(year, 10)) <= 1
    );
    if (response) {
      media.doubanId = response.id;
    }
  }
  return media;
}

const tmdbSearchTransition = new WeakMap();
tmdbSearchTransition
  .set(start, (media: MediaObj) => {
    const { season, type } = media;
    if (
      type === TmdbMediaType.TV ||
      (season && (media.type = TmdbMediaType.TV))
    ) {
      return tmdbSearchTv;
    } else {
      return tmdbSearchMovie;
    }
  })
  .set(tmdbSearchTv, (media: MediaObj) => {
    return complete;
  })
  .set(tmdbSearchMovie, (media: MediaObj) => {
    const { tmdbId } = media;
    if (tmdbId) {
      return complete;
    } else {
      return tmdbSearchTv;
    }
  });

async function tmdbSearch(media: MediaObj, state = start): Promise<MediaObj> {
  if (state === complete) {
    return media;
  } else {
    await state(media);
    return tmdbSearch(media, tmdbSearchTransition.get(state)(media));
  }
}

async function tmdbSearchTv(media: MediaObj): Promise<MediaObj> {
  const { title, year } = media;
  const { results: responses } = (await tmdbSearchApi(
    title,
    year,
    TmdbMediaType.TV
  )) as TmdbSearchTv;
  const respCount = responses.length;
  responses.sort(
    (r1, r2) =>
      Math.min(rankTitle(r1.name, title), rankTitle(r1.original_name, title)) -
      Math.min(rankTitle(r2.name, title), rankTitle(r2.original_name, title))
  );
  if (!year && respCount) {
    media.tmdbId = "" + responses[0].id;
    media.type = TmdbMediaType.TV;
  } else if (respCount) {
    const response = responses.find(
      (r) => parseInt(r.first_air_date, 10) - parseInt(year, 10) <= 1
    );
    if (response) {
      media.tmdbId = "" + responses[0].id;
      media.type = TmdbMediaType.TV;
    }
  }
  return media;
}

async function tmdbSearchMovie(media: MediaObj): Promise<MediaObj> {
  const { title, year } = media;
  const { results: responses } = (await tmdbSearchApi(
    title,
    year,
    TmdbMediaType.MOVIE
  )) as TmdbSearchMovie;
  const respCount = responses.length;
  responses.sort(
    (r1, r2) =>
      Math.min(
        rankTitle(r1.title, title),
        rankTitle(r1.original_title, title)
      ) -
      Math.min(rankTitle(r2.title, title), rankTitle(r2.original_title, title))
  );
  if (!year && respCount) {
    media.tmdbId = "" + responses[0].id;
    media.type = TmdbMediaType.MOVIE;
  } else if (respCount) {
    const response = responses.find(
      (r) => Math.abs(parseInt(r.release_date, 10) - parseInt(year, 10)) <= 1
    );
    if (response) {
      media.tmdbId = "" + responses[0].id;
      media.type = TmdbMediaType.MOVIE;
    }
  }
  return media;
}

async function tmdbDetails(media: MediaObj): Promise<MediaObj> {
  const { season, year, tmdbId, type } = media;
  const detailsPromise = tmdbDetailsApi(tmdbId, type);
  const alternativeTitlesPromise = tmdbAlternativeTitlesApi(tmdbId, type);
  const details = await detailsPromise;
  const alternativeTitles = await alternativeTitlesPromise;
  switch (type) {
    case TmdbMediaType.MOVIE: {
      const movieResult = details as TmdbMovieDetails;
      media.imdbId = movieResult.imdb_id || undefined;
      media.title = movieResult.title || undefined;
      media.originalTitle = movieResult.original_title || undefined;
      media.alternativeTitles = alternativeTitles.titles || [];
      media.genres =
        movieResult.genres.map((g) => tmdbGenresMap["" + g.id]) || [];
      return media;
    }
    case TmdbMediaType.TV: {
      const tvResult = details as TmdbTvDetails;
      if (
        tvResult.seasons.some(
          ({ air_date: airDate, season_number: seasonNumber }) => {
            const numAirDate = parseInt(airDate, 10);
            if (season && year) {
              const numSeason = parseInt(season, 10);
              const numYear = parseInt(year, 10);
              return (
                numSeason === seasonNumber &&
                Math.abs(numAirDate - numYear) <= 1 &&
                (media.year = "" + numAirDate)
              );
            } else if (season) {
              const numSeason = parseInt(season, 10);
              return (
                numSeason === seasonNumber && (media.year = "" + numAirDate)
              );
            } else if (year) {
              const numYear = parseInt(year, 10);
              return (
                Math.abs(numAirDate - numYear) <= 1 &&
                (media.season = "" + seasonNumber)
              );
            } else {
              return (
                true &&
                (media.year = "" + numAirDate) &&
                (media.season = "" + seasonNumber)
              );
            }
          }
        )
      ) {
        media.imdbId = tvResult.external_ids.imdb_id || undefined;
        media.title = tvResult.name || undefined;
        media.originalTitle = tvResult.original_name || undefined;
        media.alternativeTitles = alternativeTitles.titles || [];
        media.genres =
          tvResult.genres.map((g) => tmdbGenresMap["" + g.id]) || [];
        return media;
      }
    }
  }
  return media;
}

async function parseDoubanSubject(media: MediaObj): Promise<MediaObj> {
  return media;
}

async function complete(media: MediaObj): Promise<MediaObj> {
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
  type: TmdbMediaType = TmdbMediaType.MOVIE
): Promise<TmdbSearchMovie | TmdbSearchTv> {
  const searchParams = new URLSearchParams();
  searchParams.set("query", title);
  if (year) {
    searchParams.set("year", year);
  }
  const targetURL = new URL(
    `${tmdbApiVersionPath}/search/${type}` + "?" + searchParams.toString(),
    tmdbApiBaseUrl
  );
  const resp = await fetch(targetURL.toString());
  if (resp.ok) {
    return resp.json();
  } else {
    throw new Error(`[tmdbSearchApi] ${resp.status} ${resp.statusText}`);
  }
}

async function tmdbDetailsApi(
  tmdbId: string,
  type: TmdbMediaType = TmdbMediaType.MOVIE
): Promise<TmdbMovieDetails | TmdbTvDetails> {
  const targetURL = new URL(
    `${tmdbApiVersionPath}/${type}/${tmdbId}?append_to_response=external_ids`,
    tmdbApiBaseUrl
  );
  const resp = await fetch(targetURL.toString());
  if (resp.ok) {
    return resp.json();
  } else {
    throw new Error(`[tmdbDetailsApi] ${resp.status} ${resp.statusText}`);
  }
}

async function tmdbAlternativeTitlesApi(
  tmdbId: string,
  type: TmdbMediaType = TmdbMediaType.MOVIE
): Promise<TmdbAlternativeTitles> {
  const targetURL = new URL(
    `${tmdbApiVersionPath}/${type}/${tmdbId}/alternative_titles`,
    tmdbApiBaseUrl
  );
  const resp = await fetch(targetURL.toString());
  if (resp.ok) {
    return resp.json();
  } else {
    throw new Error(
      `[tmdbAlternativeTitles] ${resp.status} ${resp.statusText}`
    );
  }
}

function rankTitle(itemTitle: string, referenceTitle: string) {
  if (itemTitle) {
    const itemTitleLowerCase = itemTitle.toLocaleLowerCase();
    const referenceTitleLowerCase = referenceTitle.toLocaleLowerCase();
    if (itemTitle === referenceTitle) {
      return 0;
    } else if (itemTitleLowerCase === referenceTitleLowerCase) {
      return 1;
    } else if (itemTitle.startsWith(referenceTitle)) {
      return 2;
    } else if (itemTitleLowerCase.startsWith(referenceTitleLowerCase)) {
      return 3;
    } else if (itemTitle.endsWith(referenceTitle)) {
      return 4;
    } else if (itemTitleLowerCase.endsWith(referenceTitleLowerCase)) {
      return 5;
    } else if (itemTitle.includes(referenceTitle)) {
      return 6;
    } else if (itemTitleLowerCase.includes(referenceTitleLowerCase)) {
      return 7;
    } else {
      return 8;
    }
  } else {
    return Infinity;
  }
}
