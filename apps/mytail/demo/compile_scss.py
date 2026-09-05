# Auto SCSS compilation for Django project
# Place this file in your project root and run: python compile_scss.py

import os
import subprocess

def find_scss_files(base_dir):
    scss_files = []
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.scss'):
                scss_path = os.path.join(root, file)
                css_path = scss_path[:-5] + '.css'
                scss_files.append((scss_path, css_path))
    return scss_files

project_dir = os.path.dirname(os.path.abspath(__file__))
demo_dir = os.path.join(project_dir, 'demo')
scss_targets = find_scss_files(demo_dir)

for scss, css in scss_targets:
    print(f"Compiling {scss} -> {css}")
    subprocess.run(["sass", scss, css], check=True)
print("SCSS compilation complete.")
