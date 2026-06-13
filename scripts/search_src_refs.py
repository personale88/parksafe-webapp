import os

root_dir = r"C:\Users\VIGNESH\parksafe-webapp"
search_terms = ["packages/types/src", "@parksafe/types/src", "types/src/index"]

results = []

for root, dirs, files in os.walk(root_dir):
    if "node_modules" in root or ".git" in root or ".next" in root:
        continue
    for file in files:
        if file.endswith((".json", ".ts", ".tsx", ".yaml", ".yml", ".js")):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                for term in search_terms:
                    if term in content:
                        results.append((file_path, term))
            except Exception as e:
                pass

print("Search results:")
for r in results:
    print(f"File: {r[0]}, Term: {r[1]}")
