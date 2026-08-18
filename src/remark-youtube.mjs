export const YT_ID_RE = /(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/;

export function remarkYoutube() {
  return (tree) => {
    for (let i = tree.children.length - 1; i >= 0; i--) {
      const node = tree.children[i];
      if (node.type !== "paragraph") continue;
      // remark-gfm autolinkea la URL antes: tomar el texto y la url de los nodos link
      const texto = node.children
        .map((c) => (c.type === "link" ? c.url : c.value ?? ""))
        .join("")
        .trim();
      const m = texto.match(/^@youtube\s+(\S+)\s*$/);
      if (!m) continue;
      const id = m[1].match(YT_ID_RE)?.[1];
      if (!id) continue;
      tree.children[i] = {
        type: "html",
        value: `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video de YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>`,
      };
    }
  };
}
