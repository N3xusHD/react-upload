// import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
// const ffmpeg = createFFmpeg();

export default async function getSnapshots(
  files: FileList | File[],
  count: number,
  seekTimeout: number = 3000,
  setSnapshotProgress
) {
  return (
    await Promise.all(
      [...files].map((file) =>
        getSnapshotV(
          file,
          count,
          seekTimeout,
          setSnapshotProgress,
          files.length * count
        )
      )
    )
  ).flat();
}

/*
async function getSnapshotF(file: File, count: number) {
  await ffmpeg.load();
  ffmpeg.FS("writeFile", file.name, await fetchFile(file));
  await ffmpeg.run(
    "-ss",
    "00:10:00",
    "-i",
    file.name,
    "-y",
    "-vframes",
    "1",
    "-vf",
    "scale='max(sar,1)*iw':'max(1/sar,1)*ih'",
    "screenshot.png"
  );
  const data = ffmpeg.FS("readFile", "screenshot.png");
  return [
    new File(
      [new Blob([data.buffer], { type: "image/png" })],
      "screenshot.png"
    ),
  ];
}
*/

async function getSnapshotV(
  file: File,
  count: number,
  seekTimeout: number,
  setSnapshotProgress,
  totalLength
) {
  const images = [];
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  const loadMetaData = promisifyLoadMetaData(video);

  video.muted = true;
  video.src = url;
  video.load();

  await loadMetaData;

  video.pause();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const segmentDuration = video.duration / (count + 1);

  for (let i = 0; i < count; ++i) {
    const seekPromise = promisifySeeked(video);
    video.currentTime = parseFloat(((i + 1) * segmentDuration).toFixed(3));
    const timeOutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), seekTimeout);
    });
    const seekable = await Promise.race([seekPromise, timeOutPromise]);
    if (!seekable && i === 0) {
      setSnapshotProgress((prev) => prev + count / totalLength);
      return images;
    } else if (!seekable && i > 0) {
      setSnapshotProgress((prev) => prev + 1 / totalLength);
      continue;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    images.push(
      await new Promise<File>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(
            new File(
              [blob],
              `${file.name.replace(
                /\.[^/.]+$/,
                ""
              )}@${video.currentTime.toFixed(3)}.png`
            )
          );
        });
      })
    );
    setSnapshotProgress((prev) => prev + 1 / totalLength);
  }
  video.src = "";
  URL.revokeObjectURL(url);
  return images;
}

function promisifyLoadMetaData(video: HTMLVideoElement) {
  return new Promise<void>((resolve) => {
    video.addEventListener("loadedmetadata", () => resolve());
  });
}

function promisifySeeked(video: HTMLVideoElement) {
  return new Promise<boolean>((resolve) => {
    function callback() {
      video.removeEventListener("seeked", callback);
      resolve(true);
    }
    video.addEventListener("seeked", callback);
  });
}
