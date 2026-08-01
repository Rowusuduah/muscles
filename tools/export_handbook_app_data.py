"""Export the verified handbook inventory into the browser's canonical data module.

The Word/PDF builder remains the editorial source. This exporter deliberately writes
only generated app data and web-sized copies of the source photographs; it never
modifies the completed handbook or the original photographs.
"""
from __future__ import annotations

import importlib.util
import json
import re
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "tools" / "build_complete_gym_handbook.py"
CATEGORY_COLORS = {
    "Push": "#C74B50",
    "Pull": "#2E6FA7",
    "Legs": "#2E8555",
    "Core": "#7356A5",
    "Full Body": "#C67A24",
    "Cardio": "#16889E",
}


# Guide-to-exercise links are intentionally conservative: only movements supported by
# the photographed station are exposed as available. Existing exercises may remain in
# the application as deprecated records solely so historic workout logs keep rendering.
EXERCISE_LINKS: dict[int, list[str]] = {
    1: ["pl_chest_press"],
    2: ["pl_incline_press"],
    3: ["pl_decline_press"],
    4: ["pl_shoulder_press"],
    5: ["pl_seated_dip"],
    6: ["assisted_pullup", "assisted_dip"],
    7: ["pec_deck", "rear_delt_machine"],
    8: ["barbell_bench"],
    9: ["barbell_incline"],
    10: ["barbell_decline"],
    11: ["pl_lat_pulldown"],
    12: ["lat_pulldown", "straight_arm_pulldown"],
    13: ["cable_row"],
    14: ["pl_low_row"],
    15: ["pl_high_row"],
    16: ["pl_biceps_curl"],
    17: ["sel_arm_curl"],
    18: ["ez_curl"],
    19: ["ez_curl"],
    20: ["hanging_leg_raise", "pullup", "dip"],
    21: ["back_extension"],
    22: ["leg_press", "leg_press_calf"],
    23: ["matrix_glute_trainer"],
    24: ["booty_builder_hip_thrust"],
    25: ["lying_leg_curl"],
    26: ["lying_leg_curl"],
    27: ["seated_leg_curl"],
    28: ["leg_extension"],
    29: ["leg_extension"],
    30: ["hip_adduction"],
    31: ["standing_calf"],
    32: ["lying_leg_raise", "russian_twist"],
    33: ["plank"],
    34: ["lying_leg_raise", "plank", "dead_bug"],
    35: ["smith_bench", "smith_ohp", "smith_squat", "smith_rdl", "smith_hip_thrust", "close_grip_smith"],
    36: ["barbell_bench", "barbell_incline", "goblet_squat", "pullup"],
    37: ["cable_row", "cable_curl", "cable_pushdown", "overhead_cable_ext", "cable_lateral", "cable_rear_delt", "cable_kickback", "cable_crunch", "face_pull", "cable_crossover"],
    38: ["cable_row", "cable_curl", "cable_pushdown", "overhead_cable_ext", "cable_lateral", "cable_rear_delt", "cable_kickback", "cable_crunch", "face_pull", "cable_crossover"],
    39: ["db_bench", "db_incline", "db_shoulder_press", "db_row", "db_curl", "hammer_curl", "incline_db_curl", "db_lateral", "db_shrug", "db_skullcrusher", "db_rdl", "goblet_squat", "bulgarian_split", "walking_lunge", "russian_twist"],
    40: ["db_lateral", "db_curl", "hammer_curl"],
    41: [],
    42: ["db_bench", "db_incline", "db_shoulder_press", "db_row", "incline_db_curl", "db_skullcrusher"],
    43: ["upper_body_ergometer"],
    44: ["recumbent_bike"],
    45: ["treadmill_steady", "treadmill_interval"],
}

EQUIPMENT_TYPES = {
    1: "plate", 2: "plate", 3: "plate", 4: "plate", 5: "plate",
    6: "selectorized", 7: "selectorized", 8: "barbell", 9: "barbell", 10: "barbell",
    11: "plate", 12: "selectorized", 13: "cable", 14: "plate", 15: "plate",
    16: "plate", 17: "selectorized", 18: "bench", 19: "barbell", 20: "bodyweight",
    21: "bodyweight", 22: "plate", 23: "selectorized", 24: "plate", 25: "plate",
    26: "selectorized", 27: "selectorized", 28: "plate", 29: "selectorized", 30: "selectorized",
    31: "selectorized", 32: "bench", 33: "accessory", 34: "accessory", 35: "smith",
    36: "rack", 37: "cable", 38: "cable", 39: "dumbbell", 40: "dumbbell",
    41: "plate", 42: "bench", 43: "cardio", 44: "cardio", 45: "cardio",
}

# Labels are tied to explicit normalized coordinates on the primary photograph. The
# coordinates are non-destructive overlays: the source pixels are never annotated.
# Alternate views inherit the same machine-specific legend without pretending that a
# pin points to an identical pixel in a different camera angle.
CALLOUT_LAYOUTS = {
    "plate": [(18, 27), (67, 22), (18, 73), (78, 72)],
    "selectorized": [(23, 20), (71, 30), (22, 76), (75, 77)],
    "cable": [(18, 19), (73, 19), (22, 74), (77, 71)],
    "barbell": [(27, 18), (73, 31), (22, 72), (72, 78)],
    "bench": [(22, 24), (71, 27), (23, 75), (78, 71)],
    "cardio": [(22, 20), (73, 24), (26, 73), (74, 76)],
    "default": [(20, 22), (73, 23), (21, 75), (76, 74)],
}

CATEGORY_MUSCLES = {
    "Push": ["chest", "shoulders", "triceps"],
    "Pull": ["back", "biceps"],
    "Legs": ["legs", "glutes"],
    "Core": ["abs"],
    "Full Body": ["full_body"],
    "Cardio": ["cardio"],
}


def load_builder():
    spec = importlib.util.spec_from_file_location("gym_handbook_builder", BUILDER)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def photo_file(number: int) -> str:
    return "Gym equipment.jpeg" if number == 0 else f"Gym equipment {number}.jpeg"


def web_number(number: int) -> int:
    return 1 if number == 0 else number


def phases(lines: list[str]) -> list[dict[str, str]]:
    names = ["Start", "Movement", "Finish", "Return"]
    return [{"phase": names[min(i, 3)], "instruction": line} for i, line in enumerate(lines)]


def build_guides(raw_guides: list[dict]) -> list[dict]:
    guides = []
    seen_photos: set[str] = set()
    for raw in raw_guides:
        no = raw["no"]
        eq_type = EQUIPMENT_TYPES[no]
        coords = CALLOUT_LAYOUTS.get(eq_type, CALLOUT_LAYOUTS["default"])
        labels = raw["annotations"][:4]
        callouts = [
            {"id": f"c{i + 1}", "label": label, "x": coords[i][0], "y": coords[i][1]}
            for i, label in enumerate(labels)
        ]
        photos = []
        for number in raw["photos"]:
            filename = photo_file(number)
            photos.append({
                "number": number,
                "filename": filename,
                "raw": f"GYM/{filename}",
                "webp": f"assets/equipment/eq{web_number(number)}.webp",
                "alt": f"{raw['title']} — source photograph {filename}",
                "crossReference": filename in seen_photos,
            })
            seen_photos.add(filename)
        guides.append({
            "schemaVersion": 1,
            "id": f"guide-{no:02d}-{slugify(raw['title'])}",
            "no": no,
            "slug": slugify(raw["title"]),
            "identity": raw["title"],
            "aliases": [],
            "category": raw["category"],
            "categoryColor": CATEGORY_COLORS[raw["category"]],
            "equipmentType": eq_type,
            "photos": photos,
            "evidence": {"confidence": raw["confidence"], "summary": raw["evidence"]},
            "movementPattern": raw["pattern"],
            "difficulty": raw["level"],
            "beginnerSuitability": "Suitable with a conservative load and the setup checks below." if "Beginner" in raw["level"] or "All" in raw["level"] else "Learn the setup with a qualified coach or experienced spotter first.",
            "role": raw["role"],
            "purpose": raw["purpose"],
            "muscles": {"primary": raw["primary"], "secondary": raw["secondary"]},
            "categories": CATEGORY_MUSCLES[raw["category"]],
            "adjustmentsAndChecks": raw["setup"],
            "execution": phases(raw["execution"]),
            "breathing": "Exhale through the effort; inhale during the controlled return. Never hold your breath if it makes you dizzy.",
            "tempo": raw["tempo"],
            "rangeOfMotion": "Use the largest controlled, pain-free range that preserves the listed body position.",
            "cues": raw["cues"],
            "mistakes": [{"mistake": a, "correction": b} for a, b in raw["mistakes"]],
            "safety": raw["safety"],
            "programming": raw["programming"],
            "progression": raw["progression"],
            "alternatives": raw["alternatives"],
            "workoutPlacement": raw["placement"],
            "callouts": callouts,
            "linkedExerciseIds": EXERCISE_LINKS[no],
            "sources": ["Complete Gym Equipment Handbook (verified source-photo audit)"],
        })
    return guides


def write_browser_module(guides: list[dict]) -> None:
    payload = json.dumps(guides, ensure_ascii=False, indent=2)
    text = (
        "/* Generated from tools/build_complete_gym_handbook.py. Do not hand-edit. */\n"
        "(function (root, factory) {\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = factory();\n"
        "  else root.HANDBOOK_GUIDES = factory();\n"
        "})(typeof self !== 'undefined' ? self : this, function () {\n"
        f"  return {payload};\n"
        "});\n"
    )
    (ROOT / "data" / "handbook.js").write_text(text, encoding="utf-8")


def ensure_web_assets() -> list[str]:
    out_dir = ROOT / "assets" / "equipment"
    out_dir.mkdir(parents=True, exist_ok=True)
    created = []
    for number in [0, *range(2, 52)]:
        src = ROOT / "GYM" / photo_file(number)
        out = out_dir / f"eq{web_number(number)}.webp"
        if out.exists():
            continue
        with Image.open(src) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            image.save(out, "WEBP", quality=84, method=6)
        created.append(out.name)
    return created


def validate(guides: list[dict]) -> None:
    photos = [p["filename"] for guide in guides for p in guide["photos"]]
    expected = {photo_file(n) for n in [0, *range(2, 52)]}
    assert len(guides) == 45, len(guides)
    assert len(set(photos)) == 51, len(set(photos))
    assert set(photos) == expected, (expected - set(photos), set(photos) - expected)
    cross_refs = [p for guide in guides for p in guide["photos"] if p["crossReference"]]
    assert len(cross_refs) == len(photos) - 51, "Repeated appearances must be explicit cross-references"
    # Reject unsupported catalog identities/exercise claims while allowing the evidence
    # copy to explain why a commonly confused identification was rejected.
    text = " ".join(
        guide["identity"] + " " + " ".join(guide["linkedExerciseIds"])
        for guide in guides
    ).lower()
    for forbidden in ["stepmill", "elliptical", "hip abduction"]:
        assert forbidden not in text, forbidden


def main() -> None:
    builder = load_builder()
    guides = build_guides(builder.GUIDES)
    validate(guides)
    write_browser_module(guides)
    created = ensure_web_assets()
    print(f"GUIDES={len(guides)}")
    print(f"UNIQUE_PHOTOS={len({p['filename'] for g in guides for p in g['photos']})}")
    print(f"CROSS_REFERENCES={sum(1 for g in guides for p in g['photos'] if p['crossReference'])}")
    print(f"CREATED_ASSETS={','.join(created) if created else 'none'}")


if __name__ == "__main__":
    main()
