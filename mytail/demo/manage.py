#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    # If running the development server, compile SCSS before startup
    if 'runserver' in sys.argv:
        try:
            here = os.path.dirname(os.path.abspath(__file__))
            compile_script = os.path.join(here, 'compile_scss.py')
            if os.path.exists(compile_script):
                # run the compile script using the same python executable
                import subprocess
                # Capture output so we can show it in the console/logs
                proc = subprocess.run([sys.executable, compile_script], capture_output=True, text=True)
                if proc.returncode != 0:
                    sys.stderr.write(f"SCSS compilation failed (exit {proc.returncode})\n")
                    if proc.stdout:
                        sys.stderr.write("--- SCSS STDOUT ---\n")
                        sys.stderr.write(proc.stdout + "\n")
                    if proc.stderr:
                        sys.stderr.write("--- SCSS STDERR ---\n")
                        sys.stderr.write(proc.stderr + "\n")
                else:
                    # Optionally print success output if there's useful info
                    if proc.stdout:
                        sys.stderr.write("SCSS compilation output:\n")
                        sys.stderr.write(proc.stdout + "\n")
        except Exception as exc:
            # Show exception details but don't block server startup
            sys.stderr.write("Exception while attempting to compile SCSS: " + str(exc) + "\n")

    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
