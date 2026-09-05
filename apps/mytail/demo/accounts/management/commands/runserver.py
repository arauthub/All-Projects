# Custom manage.py command to compile SCSS before running server
from django.core.management.commands.runserver import Command as RunserverCommand
import subprocess
import os

class Command(RunserverCommand):
    def run(self, *args, **options):
        # Compile SCSS before running server
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        scss_script = os.path.join(project_root, 'compile_scss.py')
        if os.path.exists(scss_script):
            print('Compiling SCSS files...')
            subprocess.run(['python', scss_script], check=True)
        else:
            print('SCSS compilation script not found.')
        super().run(*args, **options)
