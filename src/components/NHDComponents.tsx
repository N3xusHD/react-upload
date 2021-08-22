import React, { useRef, Ref, useCallback, useState } from "react";

export function FormTable({ children, ...res }) {
  return (
    <table
      {...res}
      cellSpacing="0"
      cellPadding="5"
      style={{
        border: 1,
        width: "940",
      }}
    >
      <tbody>{children}</tbody>
    </table>
  );
}

export function Row({ children, ...res }) {
  return <tr {...res}>{children}</tr>;
}

export function RowHead({ isRequired, title, ...res }) {
  return (
    <td {...res} className="rowhead nowrap" valign="top" align="right">
      <div>
        {title}
        {isRequired && (
          <span
            style={{
              color: "red",
            }}
          >
            *
          </span>
        )}
      </div>
    </td>
  );
}

export function RowField({ children, message = undefined, ...res }) {
  return (
    <td {...res} className="rowfollow" valign="top" align="left">
      <div>
        {children}
        {message && (
          <>
            <br />
            <span className="medium">{message}</span>
          </>
        )}
      </div>
    </td>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      type="text"
      style={{
        width: "650px",
      }}
    />
  );
}

export function FileInput({ onChange = (files: FileList): any => {}, ...res }) {
  const inputRef: Ref<HTMLInputElement> = useRef(null);
  const handleFileChange = useCallback(() => {
    onChange(inputRef.current.files);
  }, []);
  return (
    <input
      {...res}
      ref={inputRef}
      onChange={handleFileChange}
      type="file"
      className="file"
    />
  );
}

export function TrackerRow({ passkey, ...res }) {
  const styleRef = useRef({
    color: "rgba(0, 0, 0, 0)",
    backgroundColor: "rgba(34, 118, 187, 0.5)",
    transition: "all 0.1s",
    //borderRadius: "100px",
  });

  const handleMouseOver = useCallback((e) => {
    e.target.style.color = "inherit";
    e.target.style["background-color"] = "inherit";
  }, []);

  const handleMouseOut = useCallback((e) => {
    Object.assign(e.target.style, styleRef.current);
  }, []);

  return (
    <Row {...res}>
      <td className="colhead" colSpan={2} align="center">
        http://tracker.nexushd.org/announce.php
        <span
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          style={styleRef.current}
        >
          ?passkey={passkey}
        </span>
        <br />
        http://v6.tracker.nexushd.org/announce.php
        <span
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          style={styleRef.current}
        >
          ?passkey={passkey}
        </span>
      </td>
    </Row>
  );
}

export function VideoRow({
  onChange = (files: FileList): any => {},
  title,
  isRequired = false,
  message = null,
  ...res
}) {
  return (
    <Row>
      <RowHead {...res} title={title} isRequired={isRequired} />
      <RowField message={message}>
        <VideoInput onChange={onChange} />
      </RowField>
    </Row>
  );
}

export function VideoInput({
  onChange = (files: FileList): any => {},
  ...res
}) {
  return (
    <FileInput
      {...res}
      multiple={true}
      accept=".mkv, .ts, video/*"
      onChange={onChange}
    />
  );
}

export function TorrentRow({
  onChange = (files: FileList): any => {},
  title,
  isRequired = false,
  message = null,
  ...res
}) {
  return (
    <Row>
      <RowHead {...res} title={title} isRequired={isRequired} />
      <RowField message={message}>
        <TorrentInput onChange={onChange} />
      </RowField>
    </Row>
  );
}

export function TorrentInput({
  onChange = (files: FileList): any => {},
  ...res
}) {
  return (
    <FileInput {...res} name="torrent" accept=".torrent" onChange={onChange} />
  );
}

export function TitleRow({
  value,
  onChange,
  title,
  isRequired = false,
  message = null,
  ...res
}) {
  return (
    <Row>
      <RowHead {...res} title={title} isRequired={isRequired} />
      <RowField message={message}>
        <TitleInput value={value} onChange={onChange} placeholder={title} />
      </RowField>
    </Row>
  );
}

export function TitleInput(props) {
  return <TextInput {...props} id="name" name="name" />;
}

export function QueryRow({
  title,
  isRequired = false,
  message = null,
  mediaTitle,
  onMediaTitleChange,
  mediaSeason,
  onMediaSeasonChange,
  mediaYear,
  onMediaYearChange,
  mediaDoubanId,
  onMediaDoubanIdChange,
  mediaImdbId,
  onMediaImdbIdChange,
  onSearchMedia,
  ...res
}) {
  return (
    <Row>
      <RowHead {...res} title={title} isRequired={isRequired} />
      <RowField message={message}>
        <input
          type="text"
          value={mediaTitle}
          onChange={onMediaTitleChange}
          placeholder="标题"
          style={{
            width: "180px",
          }}
        />
        <input
          type="text"
          value={mediaSeason}
          onChange={onMediaSeasonChange}
          placeholder="季"
          style={{
            width: "90px",
          }}
        />
        <input
          type="text"
          value={mediaYear}
          onChange={onMediaYearChange}
          placeholder="年份"
          style={{
            width: "90px",
          }}
        />
        <input
          type="text"
          value={mediaDoubanId}
          onChange={onMediaDoubanIdChange}
          placeholder="豆瓣ID"
          style={{
            width: "90px",
          }}
        />
        <input
          type="text"
          value={mediaImdbId}
          onChange={onMediaImdbIdChange}
          placeholder="IMDb ID"
          style={{
            width: "90px",
          }}
        />
        <input type="button" value="获取信息" onClick={onSearchMedia} />
      </RowField>
    </Row>
  );
}

export function SubTitleRow({
  value,
  onChange,
  title,
  isRequired = false,
  message = null,
  ...res
}) {
  return (
    <Row>
      <RowHead {...res} title={title} isRequired={isRequired} />
      <RowField message={message}>
        <SubTitleInput value={value} onChange={onChange} placeholder={title} />
      </RowField>
    </Row>
  );
}

export function SubTitleInput(props) {
  return <TextInput {...props} name="small_descr" />;
}

export function MediaInfoRow({
  startTagValue,
  onStartTagChange,
  endTagValue,
  onEndTagChange,
  canCopyFirst,
  onCopyFirstMediaInfo,
  canCopyAll,
  onCopyAllMediaInfo,
  title,
  isRequired = false,
  message = null,
  ...res
}) {
  return (
    <Row>
      <RowHead {...res} title={title} isRequired={isRequired} />
      <RowField message={message}>
        <input
          type="search"
          value={startTagValue}
          onChange={onStartTagChange}
          style={{
            width: `${Math.max(startTagValue.toString().length + 7, 10)}ch`,
          }}
          list="start-tag-options"
          placeholder="起始"
        />
        <datalist id="start-tag-options">
          <option></option>
          <option>[box=MediaInfo]</option>
          <option>[quote][box=MediaInfo]</option>
          <option>[mi]</option>
          <option>[code]</option>
        </datalist>
        <input
          type="search"
          value={endTagValue}
          onChange={onEndTagChange}
          style={{
            width: `${Math.max(endTagValue.toString().length + 7, 10)}ch`,
          }}
          list="end-tag-options"
          placeholder="结束"
        />
        <datalist id="end-tag-options">
          <option></option>
          <option>[/box]</option>
          <option>[/quote]</option>
          <option>[/mi]</option>
          <option>[/code]</option>
        </datalist>
        <input
          type="button"
          className="btn2"
          value="复制首个"
          onClick={onCopyFirstMediaInfo}
          disabled={!canCopyFirst}
        />
        <input
          type="button"
          className="btn2"
          value="复制所有"
          onClick={onCopyAllMediaInfo}
          disabled={!canCopyAll}
        />
      </RowField>
    </Row>
  );
}

export function SnapshotRow({
  value,
  onChange,
  canChangeSnapshotCount,
  displayTakeSnapshots,
  canTakeSnapshots,
  onTakeSnapshots,
  displayBundleSnapshots,
  canBundleSnapshots,
  onBundleSnapshots,
  displayDownloadSnapshots,
  canDownloadSnapshots,
  onDownloadSnapshots,
  title,
  isRequired = false,
  message = null,
  ...res
}) {
  return (
    <Row>
      <RowHead {...res} title={title} isRequired={isRequired} />
      <RowField message={message}>
        <input
          type="number"
          value={value}
          onChange={onChange}
          step={1}
          min={1}
          max={20}
          disabled={!canChangeSnapshotCount}
        />
        {displayTakeSnapshots && (
          <input
            type="button"
            className="btn2"
            value="截图"
            onClick={onTakeSnapshots}
            disabled={!canTakeSnapshots}
          />
        )}
        {displayBundleSnapshots && (
          <input
            type="button"
            className="btn2"
            value="打包"
            onClick={onBundleSnapshots}
            disabled={!canBundleSnapshots}
          />
        )}
        {displayDownloadSnapshots && (
          <input
            type="button"
            className="btn2"
            value="下载"
            onClick={onDownloadSnapshots}
            disabled={!canDownloadSnapshots}
          />
        )}
      </RowField>
    </Row>
  );
}
