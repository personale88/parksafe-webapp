import os

root_dir = r"C:\Users\VIGNESH\parksafe-webapp\apps\api"
results = []

for root, dirs, files in os.walk(root_dir):
    if "node_modules" in root or ".git" in root or "dist" in root:
        continue
    for file in files:
        if file.endswith((".json", ".ts", ".js")):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                if "paths" in content or "alias" in content or "loader" in content or "register" in content:
                    results.append(file_path)
            except:
                pass

print("Search results:")
for r in results:
    print(r)
