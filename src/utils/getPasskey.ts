export async function getPasskey() {
  const resp = await fetch("usercp.php");
  if (resp.ok) {
    const result = await resp.text();
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(result, "text/html");
    try {
      return dom
        .querySelector("td#outer > table.main + table")
        .innerHTML.match(/(?<=<div>)[a-z0-9]{32}(?=<\/div>)/)[0];
    } catch (e) {
      return "";
    }
  } else {
    return "";
  }
}

export default getPasskey;
