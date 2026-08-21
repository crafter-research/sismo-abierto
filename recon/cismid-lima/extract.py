from osgeo import ogr, osr
import json, re, sys
ogr.UseExceptions()

LEVEL = {
    "#267300": (1, "Sin dano o dano superficial", "< 15%", "Bajo"),
    "#55FF00": (2, "Dano leve", "15% - 30%", "Bajo"),
    "#FFFF00": (3, "Dano moderado", "30% - 60%", "Moderado"),
    "#FFAA00": (4, "Dano severo", "60% - 85%", "Moderado"),
    "#FF0000": (5, "Colapso", "> 85%", "Alto"),
}
BRUSH = re.compile(r"BRUSH\(fc:(#[0-9A-Fa-f]{6})\)")

ds = ogr.Open("R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf")
src = osr.SpatialReference(); src.ImportFromEPSG(32718)
dst = osr.SpatialReference(); dst.ImportFromEPSG(4326)
dst.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
tx = osr.CoordinateTransformation(src, dst)

feats, skipped, unknown = [], 0, {}
for i in range(ds.GetLayerCount()):
    lyr = ds.GetLayerByIndex(i)
    name = lyr.GetName()
    if not name.startswith("Zona_Estudio_CISMID"):
        continue
    m = re.match(r"Zona_Estudio_(CISMID-[A-Z]+)_(.+?)_-_(\d{4})(?:_(.+))?$", name)
    if not m:
        print("NO PARSEA:", name, file=sys.stderr); continue
    funder, district, year, variant = m.groups()
    for feat in lyr:
        st = feat.GetStyleString() or ""
        mb = BRUSH.search(st)
        g = feat.GetGeometryRef()
        if not mb or g is None:
            skipped += 1; continue
        color = mb.group(1).upper()
        if color not in LEVEL:
            unknown[color] = unknown.get(color, 0) + 1; skipped += 1; continue
        lvl, desc, cost, risk = LEVEL[color]
        g = g.Clone(); g.Transform(tx)
        feats.append({
            "type": "Feature",
            "properties": {
                "district": district.replace("_", " ").title(),
                "funder": funder, "year": int(year),
                "level": lvl, "damage": desc, "repair_cost": cost, "risk": risk,
                "color": color,
            },
            "geometry": json.loads(g.ExportToJson()),
        })

print(f"features: {len(feats)}  skipped: {skipped}  unknown colors: {unknown}", file=sys.stderr)
json.dump({"type": "FeatureCollection", "features": feats}, open("lima-riesgo.geojson", "w"))
