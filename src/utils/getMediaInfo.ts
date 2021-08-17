export default async function getMediaInfo(file: File, MediaInfoModule) {
  const MI = new MediaInfoModule.MediaInfo();
  return new Promise((resolve) => {
    MI.Open(file, () => {
      MI.Option("Complete");
      const MediaInfoText = MI.Inform().trim();
      MI.Close();
      MI.delete();
      resolve(MediaInfoText);
    });
  });
}
