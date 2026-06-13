import os

root_dir = r"C:\Users\VIGNESH\parksafe-webapp"
results = []

for root, dirs, files in os.walk(root_dir):
    if "@parksafe" in root:
        results.append(root)

print("Found @parksafe directories:")
for r in results:
    print(r)
