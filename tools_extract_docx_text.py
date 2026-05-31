import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


def extract_docx_text(docx_path: str) -> str:
    docx_path = str(docx_path)
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml")

    root = ET.fromstring(xml)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

    paras: list[str] = []
    for para in root.findall(".//w:p", ns):
        runs = para.findall(".//w:t", ns)
        if not runs:
            continue
        txt = "".join((r.text or "") for r in runs)
        txt = re.sub(r"\s+", " ", txt).strip()
        if txt:
            paras.append(txt)
    return "\n".join(paras)


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("docx", help="Path to .docx")
    ap.add_argument("--out", help="Output .txt path (defaults next to docx)")
    args = ap.parse_args()

    src = Path(args.docx)
    out = Path(args.out) if args.out else src.with_suffix(".extracted.txt")
    out.write_text(extract_docx_text(str(src)), encoding="utf-8")
    print(str(out))


if __name__ == "__main__":
    main()

