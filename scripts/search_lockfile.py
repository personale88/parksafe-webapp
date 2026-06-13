with open(r"C:\Users\VIGNESH\parksafe-webapp\pnpm-lock.yaml", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()
matches = [f"{i+1}: {line}" for i, line in enumerate(lines) if "types" in line or "@parksafe" in line]

print("Matches in pnpm-lock.yaml:")
for m in matches[:100]:
    print(m)
