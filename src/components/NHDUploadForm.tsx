import {
  FormTable,
  TrackerRow,
  TorrentRow,
  TitleRow,
  QueryRow,
  SubTitleRow,
  VideoRow,
  MediaInfoRow,
  SnapshotRow,
} from "./NHDComponents";
import MediaInfoLib from "../utils/media-info-lib";
import getMediaInfo from "../utils/getMediaInfo";
import parseTorrent from "parse-torrent";
import getPasskey from "../utils/getPasskey";
import copyToClipboard from "../utils/copyToClipboard";
import getSnapshots from "../utils/bundleSnapshots";
import ptt, { DefaultParserResult } from "parse-torrent-title";
import BFSA from "browser-fs-access";
import React, { useCallback, useEffect, useState } from "react";
import fflate from "fflate";
import ProgressBar from "@ramonak/react-progress-bar";
import searchMedia from "../utils/searchMedia";

const MediaInfoModulePromise = new Promise((resolve) => {
  const MediaInfoLibPromise = MediaInfoLib({
    postRun: function () {
      MediaInfoLibPromise.then(function (module: any) {
        resolve(module);
      });
    },
  });
});

function formatTorrentName(torrentName: string) {
  return torrentName
    .replace(/\.(mkv|mp4|avi|ts|wmv|mpg)/, "")
    .replace(/\bh\.(26[45])\b/gi, "H/$1")
    .replace(/(?<=\b[a-zA-Z]*\d{1,2})\.(?=\d{1,2}\b)/g, "/")
    .replace(/\b\((\d{4})\)\b/g, "$1")
    .replace(/\bWEB(?!-DL)\b/gi, "WEB-DL")
    .replace(/\bweb-?rip\b/gi, "WEBRip")
    .replace(/\bblu-?ray\b/gi, "BluRay")
    .replace(/\bdvd(rip)?\b/gi, (_, p1) => `DVD${p1 ? "Rip" : ""}`)
    .replace(/(?<=\b(?:480|720|1080|2160))[pi]\b/gi, (m) => m.toLowerCase())
    .replace(/\bx\.?(26[45])\b/gi, "x$1")
    .replace(/\./g, " ")
    .replace(/\//g, ".");
}

function useMediaInfo(videos): [string[], boolean, string, boolean, number] {
  const [mediaInfos, setMediaInfos] = useState([]);
  const [canCopyAll, setCanCopyAll] = useState(false);
  const [mediaInfo, setMediaInfo] = useState("");
  const [canCopyFirst, setCanCopyFirst] = useState(false);
  const [mediaInfoCounter, setMediaInfoCounter] = useState(0);
  const mediaInfoProgress = mediaInfoCounter / (videos.length || 1);
  useEffect(() => {
    async function getMediaInfos() {
      const temp = [];
      if (videos.length === 0) {
        setMediaInfo("");
      } else {
        for (let i = 0; i < videos.length; ++i) {
          const video = videos[i];
          const parsedMediaInfo = (await getMediaInfo(
            video,
            await MediaInfoModulePromise
          )) as string;
          if (i === 0) {
            setMediaInfo(parsedMediaInfo);
            setCanCopyFirst(true);
          }
          temp.push(parsedMediaInfo);
          setMediaInfoCounter((prevCount) => ++prevCount);
        }
      }
      setMediaInfos(temp);
      setCanCopyAll(true);
    }
    setCanCopyAll(false);
    setCanCopyFirst(false);
    setMediaInfoCounter(0);
    getMediaInfos();
  }, [videos]);

  useEffect(() => {
    setCanCopyAll(Boolean(mediaInfos.length));
  }, [mediaInfos]);

  useEffect(() => {
    setCanCopyFirst(mediaInfo === "" ? false : true);
  }, [mediaInfo]);

  return [mediaInfos, canCopyAll, mediaInfo, canCopyFirst, mediaInfoProgress];
}

export default function NHDUploadForm() {
  const [passkey, setPasskey] = useState("");
  const [torrent, setTorrent] = useState(null);
  const [title, setTitle] = useState("");
  const [torrentNameInfo, setTorrentNameInfo] = useState({
    title: "",
  } as DefaultParserResult);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaSeason, setMediaSeason] = useState("");
  const [mediaYear, setMediaYear] = useState("");
  const [mediaDoubanId, setMediaDoubanId] = useState("");
  const [mediaImdbId, setMediaImdbId] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [videos, setVideos] = useState([]);
  const [mediaInfoStartTag, setMediaInfoStartTag] = useState("[box=MediaInfo]");
  const [mediaInfoEndTag, setMediaInfoEndTag] = useState("[/box]");
  const [snapshotCount, setSnapshotCount] = useState(2);
  const [canTakeSnapshots, setCanTakeSnapshots] = useState(false);
  const [snapshotFiles, setSnapshotFiles] = useState<File[]>([]);
  const [canBundleSnapshots, setCanBundleSnapshots] = useState(false);
  const [snapshotBundle, setSnapshotBundle] = useState<File>(null);
  const [canDownloadSnapshots, setCanDownload] = useState(false);
  const [canChangeSnapshotCount, setCanChangeSnapshotCount] = useState(true);
  const [snapshotProgress, setSnapshotProgress] = useState(0);

  const [mediaInfos, canCopyAll, mediaInfo, canCopyFirst, mediaInfoProgress] =
    useMediaInfo(videos);

  useEffect(() => {
    getPasskey().then((pk) => {
      setPasskey(pk);
    });
  }, []);

  useEffect(() => {
    if (torrent !== null) {
      parseTorrent.remote(torrent, (err, parsedTorrent) => {
        if (err) {
          throw err;
        }
        setTitle(formatTorrentName(parsedTorrent.name));
      });
    } else {
      setTitle("");
    }
  }, [torrent]);

  useEffect(() => {
    const info = ptt.parse(title);
    setTorrentNameInfo(info);
  }, [title]);

  useEffect(() => {
    setMediaTitle(torrentNameInfo.title);
    setMediaYear(torrentNameInfo.year ? torrentNameInfo.year + "" : "");
    setMediaSeason(torrentNameInfo.season ? torrentNameInfo.season + "" : "");
  }, [torrentNameInfo]);

  const handleTorrentChange = useCallback((files) => {
    if (files.length) {
      setTorrent(files[0]);
    } else {
      setTorrent(null);
    }
  }, []);

  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value);
  }, []);

  const handleMediaTitleChange = useCallback((e) => {
    setMediaTitle(e.target.value);
  }, []);

  const handleMediaSeasonChange = useCallback((e) => {
    setMediaSeason(e.target.value);
  }, []);

  const handleMediaYearChange = useCallback((e) => {
    setMediaYear(e.target.value);
  }, []);

  const handleMediaDoubanIdChange = useCallback((e) => {
    setMediaDoubanId(e.target.value);
  }, []);

  const handleMediaImdbIdChange = useCallback((e) => {
    setMediaImdbId(e.target.value);
  }, []);

  const handleSearchMedia = useCallback(() => {
    async function f() {
      const media = await searchMedia({
        title: mediaTitle || undefined,
        season: mediaSeason || undefined,
        year: mediaYear || undefined,
        doubanId: mediaDoubanId || undefined,
        imdbId: mediaImdbId || undefined,
      });
      console.log(media);
    }
    f();
  }, [mediaTitle, mediaYear, mediaDoubanId, mediaImdbId]);

  const handleSubTitleChange = useCallback((e) => {
    setSubTitle(e.target.value);
  }, []);

  const handleVideosChange = useCallback((files) => {
    setVideos(files);
  }, []);

  const handleCopyFirstMediaInfo = useCallback(() => {
    copyToClipboard(mediaInfoStartTag + mediaInfo + mediaInfoEndTag);
  }, [mediaInfoStartTag, mediaInfo, mediaInfoEndTag]);

  const handleCopyAllMediaInfo = useCallback(() => {
    copyToClipboard(
      mediaInfos
        .map((mi) => mediaInfoStartTag + mi + mediaInfoEndTag)
        .join("\n\n")
    );
  }, [mediaInfoStartTag, mediaInfos, mediaInfoEndTag]);

  const handleMediaInfoStartTagChange = useCallback((e) => {
    setMediaInfoStartTag(e.target.value);
  }, []);

  const handleMediaInfoEndTagChange = useCallback((e) => {
    setMediaInfoEndTag(e.target.value);
  }, []);

  const handleSnapshotCountChange = useCallback((e) => {
    setSnapshotCount(parseInt(e.target.value || 0));
  }, []);

  const handleTakeSnapshots = useCallback(() => {
    async function f() {
      const snapshots = await getSnapshots(
        videos,
        snapshotCount,
        3000,
        setSnapshotProgress
      );
      setSnapshotFiles(snapshots);
      setCanTakeSnapshots(true);
      setCanChangeSnapshotCount(true);
    }
    setCanTakeSnapshots(false);
    setCanChangeSnapshotCount(false);
    f();
  }, [videos, snapshotCount]);

  const handleBundleSnapshots = useCallback(() => {
    async function f() {
      const bundle = new File(
        [
          new Blob([
            fflate.zipSync(
              Object.fromEntries(
                await Promise.all(
                  snapshotFiles.map(async (f) => [
                    f.name,
                    new Uint8Array(await f.arrayBuffer()),
                  ])
                )
              ),
              {
                level: 0,
                comment: "by TYT@NexusHD",
              }
            ),
          ]),
        ],
        `snapshots-${Date.now()}.zip`
      );
      setSnapshotBundle(bundle);
      setCanBundleSnapshots(true);
      setCanChangeSnapshotCount(true);
    }
    setCanBundleSnapshots(false);
    setCanChangeSnapshotCount(false);
    f();
  }, [snapshotFiles]);

  const handleDownloadSnapshots = useCallback(() => {
    BFSA.fileSave(snapshotBundle, {
      fileName: snapshotBundle.name,
      extensions: [".zip"],
    });
  }, [snapshotBundle]);

  const hasVideos = Boolean(videos.length);
  const hasSnapshotFiles = Boolean(snapshotFiles.length);
  const hasSnapshotBundle = Boolean(snapshotBundle);

  const displayTakeSnapshots = !(hasSnapshotBundle || hasSnapshotFiles);
  const displayBundleSnapshots = !hasSnapshotBundle && hasSnapshotFiles;
  const displayDownloadSnapshots = hasSnapshotBundle;

  useEffect(() => {
    setSnapshotFiles([]);
    setSnapshotBundle(null);
    setSnapshotProgress(0);
  }, [videos, snapshotCount]);

  useEffect(() => {
    setCanTakeSnapshots(hasVideos);
  }, [hasVideos]);

  useEffect(() => {
    setCanBundleSnapshots(hasSnapshotFiles);
  }, [snapshotFiles]);

  useEffect(() => {
    setCanDownload(hasSnapshotBundle);
  }, [snapshotBundle]);

  return (
    <FormTable>
      <TrackerRow passkey={passkey} />
      <TorrentRow
        title="种子文件"
        isRequired={true}
        onChange={handleTorrentChange}
      />
      <TitleRow
        title="标题"
        isRequired={true}
        value={title}
        onChange={handleTitleChange}
        message={
          <>
            (默认值将自动根据种子文件推测，<b>要求规范填写</b>，如
            <i>"Blade Runner 1982 Final Cut 720p HDDVD DTS x264-ESiR"</i>)
          </>
        }
      />
      <QueryRow
        title="查询信息"
        isRequired={false}
        mediaTitle={mediaTitle}
        onMediaTitleChange={handleMediaTitleChange}
        mediaSeason={mediaSeason}
        onMediaSeasonChange={handleMediaSeasonChange}
        mediaYear={mediaYear}
        onMediaYearChange={handleMediaYearChange}
        mediaDoubanId={mediaDoubanId}
        onMediaDoubanIdChange={handleMediaDoubanIdChange}
        mediaImdbId={mediaImdbId}
        onMediaImdbIdChange={handleMediaImdbIdChange}
        onSearchMedia={handleSearchMedia}
      />
      <SubTitleRow
        title="副标题"
        isRequired={false}
        value={subTitle}
        onChange={handleSubTitleChange}
        message={
          <>
            (将在种子页面种子标题下显示，一般填写资源的<b>中文名称</b>与
            <b>简介关键词</b>)
          </>
        }
      />
      <VideoRow
        title="视频文件"
        isRequired={false}
        onChange={handleVideosChange}
        message={
          <>
            (仅用于在前端获取 <b>MediaInfo</b> 和<b>视频截图</b>，<b>不会</b>
            上传至服务器)
          </>
        }
      />
      <MediaInfoRow
        title="MediaInfo"
        isRequired={false}
        startTagValue={mediaInfoStartTag}
        onStartTagChange={handleMediaInfoStartTagChange}
        endTagValue={mediaInfoEndTag}
        onEndTagChange={handleMediaInfoEndTagChange}
        canCopyFirst={canCopyFirst}
        onCopyFirstMediaInfo={handleCopyFirstMediaInfo}
        canCopyAll={canCopyAll}
        onCopyAllMediaInfo={handleCopyAllMediaInfo}
        message={
          <ProgressBar
            completed={100 * mediaInfoProgress}
            height="5px"
            bgColor="#2276BB"
            transitionDuration="0.2s"
            isLabelVisible={false}
            padding="2px"
          />
        }
      />
      <SnapshotRow
        title="视频截图"
        isRequired={false}
        value={snapshotCount}
        onChange={handleSnapshotCountChange}
        canChangeSnapshotCount={canChangeSnapshotCount}
        displayTakeSnapshots={displayTakeSnapshots}
        canTakeSnapshots={canTakeSnapshots}
        onTakeSnapshots={handleTakeSnapshots}
        displayBundleSnapshots={displayBundleSnapshots}
        canBundleSnapshots={canBundleSnapshots}
        onBundleSnapshots={handleBundleSnapshots}
        displayDownloadSnapshots={displayDownloadSnapshots}
        canDownloadSnapshots={canDownloadSnapshots}
        onDownloadSnapshots={handleDownloadSnapshots}
        message={
          <ProgressBar
            completed={100 * snapshotProgress}
            height="5px"
            bgColor="#A83838"
            transitionDuration="0.2s"
            isLabelVisible={false}
            padding="2px"
          />
        }
      />
    </FormTable>
  );
}
