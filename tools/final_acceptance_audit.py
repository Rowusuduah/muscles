from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import zipfile
from pathlib import Path

import fitz
from lxml import etree


ROOT = Path(r"E:\gYM")
DOCX = ROOT / "Complete_Gym_Equipment_Handbook_Revised.docx"
PDF = ROOT / "Complete_Gym_Equipment_Handbook_Revised.pdf"
SOURCE_DIR = ROOT / "GYM"
BUILDER = ROOT / "tools" / "build_complete_gym_handbook.py"
REPORT = ROOT / ".handbook_qa" / "final_acceptance.json"


def load_builder():
    spec = importlib.util.spec_from_file_location("handbook_builder", BUILDER)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def normalized(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    builder = load_builder()
    expected_photo_ids = [0] + list(range(2, 52))
    expected_source_files = [builder.photo_name(i) for i in expected_photo_ids]
    actual_source_files = sorted(path.name for path in SOURCE_DIR.glob("*.jpeg"))
    assert len(actual_source_files) == 51
    assert sorted(expected_source_files) == actual_source_files

    mapping = builder.photo_mapping()
    assert sorted(mapping) == expected_photo_ids
    assert all(mapping[photo_id] for photo_id in expected_photo_ids)
    assert len(builder.GUIDES) == 45

    required_fields = {
        "no", "category", "title", "photos", "confidence", "evidence",
        "pattern", "level", "role", "purpose", "primary", "secondary",
        "setup", "execution", "cues", "mistakes", "safety", "alternatives",
        "placement", "programming", "progression", "tempo", "movement",
    }
    for guide in builder.GUIDES:
        assert required_fields <= set(guide)
        assert all(guide[field] not in (None, "", []) for field in required_fields)
        assert all(photo_id in expected_photo_ids for photo_id in guide["photos"])

    pdf = fitz.open(PDF)
    assert pdf.page_count == 187
    page_text = [normalized(page.get_text()) for page in pdf]

    guide_pages = {}
    for guide in builder.GUIDES:
        identify_page = 21 + (guide["no"] - 1) * 3
        technique_page = identify_page + 1
        identify_title = f"{guide['no']:02d}. {guide['title']}"
        assert identify_title in page_text[identify_page - 1]
        assert f"{guide['title']}: Setup and Technique" in page_text[technique_page - 1]
        technique_text = page_text[technique_page - 1]
        assert "1. Start position:" in technique_text or "1. Movement:" in technique_text
        assert "Perform 1." in technique_text
        guide_pages[str(guide["no"])] = identify_page

    program_pages = {}
    for index, (title, _bookmark, _items) in enumerate(builder.PROGRAM_PAGES):
        page_number = 156 + index // 2
        assert title in page_text[page_number - 1]
        program_pages[title] = page_number

    fixed_pages = {
        "Machine Settings Log": 164,
        "Weekly Training Planner": 165,
        "Strength Session Log 1": 166,
        "Strength Session Log 2": 167,
        "Strength Session Log 3": 168,
        "Strength Session Log 4": 169,
        "Cardio Log": 170,
        "Performance and Measurement Log": 171,
        "Monthly Review": 172,
        "Safety and Equipment Checklist": 173,
        "Photo Index 1 of 3": 174,
        "Photo Index 2 of 3": 175,
        "Photo Index 3 of 3": 176,
        "References 2 of 2": 187,
    }
    for title, page_number in fixed_pages.items():
        assert title in page_text[page_number - 1], f"Expected {title!r} on page {page_number}"

    photo_index_text = " ".join(page_text[173:176])
    for filename in expected_source_files:
        assert photo_index_text.count(filename) == 1, filename

    critical_identity_checks = [
        ("Gym equipment 3.jpeg", "Plate-Loaded Lat Pulldown"),
        ("Gym equipment 4.jpeg", "Plate-Loaded Decline Press"),
        ("Gym equipment 9.jpeg", "Matrix Glute Trainer"),
        ("Gym equipment 12.jpeg", "Plate-Loaded Lying Leg Curl"),
        ("Gym equipment 44.jpeg", "Hip Adduction Machine"),
        ("Gym equipment 45.jpeg", "Hip Adduction Machine"),
        ("Gym equipment 50.jpeg", "Technogym Excite Top Upper-Body Ergometer"),
    ]
    for filename, identity in critical_identity_checks:
        assert filename in photo_index_text and identity in photo_index_text
    assert not any("StepMill" in guide["title"] for guide in builder.GUIDES)

    pdf_internal_links = 0
    for page in pdf:
        pdf_internal_links += sum(1 for link in page.get_links() if link.get("kind") == fitz.LINK_GOTO)
    pdf_outline_entries = len(pdf.get_toc(simple=True))
    assert pdf_internal_links >= 90
    assert pdf_outline_entries >= 100

    footer_matches = sum(
        1 for page_number, text in enumerate(page_text, 1)
        if f"PAGE {page_number} OF 187" in text
    )
    assert footer_matches >= 186

    ns = {
        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
        "dc": "http://purl.org/dc/elements/1.1/",
        "cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
    }
    with zipfile.ZipFile(DOCX) as package:
        document_xml = etree.fromstring(package.read("word/document.xml"))
        core_xml = etree.fromstring(package.read("docProps/core.xml"))

    bookmark_names = document_xml.xpath("//w:bookmarkStart/@w:name", namespaces=ns)
    hyperlink_anchors = document_xml.xpath("//w:hyperlink/@w:anchor", namespaces=ns)
    image_alt = document_xml.xpath("//wp:docPr/@descr", namespaces=ns)
    image_count = len(document_xml.xpath("//wp:inline", namespaces=ns))
    assert len(set(bookmark_names)) >= 100
    assert len(hyperlink_anchors) >= 90
    assert image_count == 64
    assert len(image_alt) == image_count and all(value.strip() for value in image_alt)

    creator = core_xml.xpath("string(dc:creator)", namespaces=ns).strip()
    modified_by = core_xml.xpath("string(cp:lastModifiedBy)", namespaces=ns).strip()
    pdf_author = (pdf.metadata or {}).get("author", "").strip()
    assert not creator and not modified_by and not pdf_author

    result = {
        "status": "PASS",
        "pages_docx_word_export": 187,
        "pages_pdf": pdf.page_count,
        "guides": len(builder.GUIDES),
        "source_photos": len(expected_source_files),
        "mapped_photos": len(mapping),
        "unmapped_photos": [],
        "inline_images": image_count,
        "image_alt_text_missing": 0,
        "docx_bookmarks": len(set(bookmark_names)),
        "docx_internal_links": len(hyperlink_anchors),
        "pdf_internal_links": pdf_internal_links,
        "pdf_outline_entries": pdf_outline_entries,
        "page_footers_verified": footer_matches,
        "guide_identify_pages": guide_pages,
        "program_pages": program_pages,
        "metadata": {"docx_creator": creator, "docx_last_modified_by": modified_by, "pdf_author": pdf_author},
        "sha256": {"docx": sha256(DOCX), "pdf": sha256(PDF)},
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
