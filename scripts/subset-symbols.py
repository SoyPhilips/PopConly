"""Poda LigatureSubst a los iconos usados y luego corre pyftsubset.

Uso: python scripts/subset-symbols.py  (pip install fonttools brotli)
Si agregas un icono, añádelo a ICONS y vuelve a correr.
"""
import pathlib, subprocess, sys

ICONS = set("""
add arrow_back arrow_forward arrow_outward auto_awesome bolt bookmark_add
bookmark_added bookmark_remove broken_image casino check check_circle
chevron_left chevron_right close credit_card device_reset devices
download_for_offline edit error expand_less expand_more favorite forward_10
fullscreen grid_view hide_source high_quality history info language laptop
laptop_mac link_off local_fire_department local_movies lock logout mail
manage_accounts manage_search military_tech more_vert movie_edit movie_filter
notifications notifications_active offline_pin open_in_new pause payments
person phone_iphone photo_camera play_arrow playlist_add power_settings_new
progress_activity receipt_long replay replay_10 schedule search sentiment_very_satisfied
share smart_display smartphone star stars support_agent swap_vert sync tune tv
verified view_agenda visibility visibility_off volume_off volume_up
""".split())

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "fonts" / "material-symbols-outlined.woff2"
BACKUP = pathlib.Path("C:/Users/Charlie/AppData/Local/Temp/opencode/symbols-full-backup.woff2")

DIGITS = {
    "digit_zero": "0", "digit_one": "1", "digit_two": "2",
    "digit_three": "3", "digit_four": "4", "digit_five": "5",
    "digit_six": "6", "digit_seven": "7", "digit_eight": "8",
    "digit_nine": "9",
}

def spell(first: str, comps) -> str:
    """Nombre del icono que forma una regla de ligadura."""
    parts = [first]
    for c in comps:
        if len(c) == 1:
            parts.append(c)
        elif c == "underscore":
            parts.append("_")
        elif c in DIGITS:
            parts.append(DIGITS[c])
        else:
            parts.append(f"<{c}>")
    return "".join(parts)

def main() -> None:
    from fontTools.ttLib import TTFont

    if not BACKUP.exists():
        BACKUP.parent.mkdir(parents=True, exist_ok=True)
        BACKUP.write_bytes(SRC.read_bytes())
        print("backup original:", BACKUP, BACKUP.stat().st_size)

    font = TTFont(BACKUP)
    gsub = font["GSUB"].table
    kept_rules, kept_names = 0, set()
    for look in gsub.LookupList.Lookup:
        for st in look.SubTable:
            inner = getattr(st, "ExtSubTable", st)
            ligs = getattr(inner, "ligatures", None)
            if not ligs:
                continue
            for first in list(ligs.keys()):
                rules = ligs[first]
                keep = [r for r in rules
                        if spell(first, r.Component) in ICONS]
                kept_rules += len(keep)
                kept_names.update(spell(first, r.Component) for r in keep)
                if keep:
                    ligs[first] = keep
                else:
                    del ligs[first]
    missing = ICONS - kept_names
    print(f"reglas conservadas: {kept_rules}, iconos hallados: {len(kept_names)}")
    if missing:
        sys.exit(f"ICONOS NO ENCONTRADOS EN LA FUENTE: {sorted(missing)}")

    pruned = ROOT / "scripts" / ".symbols-pruned.ttf"
    font.save(pruned)

    text = "".join(f"{n}\n" for n in sorted(ICONS))
    names_file = ROOT / "scripts" / ".symbols-names.txt"
    names_file.write_text(text, encoding="utf-8")
    tmp = ROOT / "scripts" / ".symbols-subset.woff2"
    cmd = [
        sys.executable, "-m", "fontTools.subset", str(pruned),
        f"--output-file={tmp}",
        "--flavor=woff2",
        "--layout-features=*",
        f"--text-file={names_file}",
        "--no-hinting",
        "--name-IDs=0,1,2,3,4,5,6",
    ]
    print(" ".join(cmd))
    subprocess.run(cmd, check=True)
    SRC.write_bytes(tmp.read_bytes())
    print("subset:", SRC, SRC.stat().st_size)
    for p in (pruned, tmp, names_file):
        p.unlink(missing_ok=True)

if __name__ == "__main__":
    main()
