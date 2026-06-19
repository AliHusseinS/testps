import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

results = []
for idx, line in enumerate(lines):
    # Search for occurrences of 'القسم' or 'قسم' in javascript code or filters
    if 'القسم' in line or 'قسم' in line:
        results.append(f"Line {idx+1}: {line.strip()}")

with open('scratch/search_depts_results.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(results))

print("Done")
