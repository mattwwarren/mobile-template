#!/usr/bin/env python3
"""Post-generation tasks for Mobile template.

This script runs automatically after copier generates a new project.
It handles initial setup tasks that would otherwise be manual.
"""

import re
import shutil
import subprocess
import sys
from pathlib import Path

# Copier provides these via environment or we read from answers file
try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


def log_step(message: str) -> None:
    """Print a step message with formatting."""
    print(f"\n{'=' * 60}")
    print(f"  {message}")
    print(f"{'=' * 60}\n")


def log_success(message: str) -> None:
    """Print a success message."""
    print(f"  {message}")


def log_error(message: str) -> None:
    """Print an error message."""
    print(f"  {message}", file=sys.stderr)


def log_warning(message: str) -> None:
    """Print a warning message."""
    print(f"  {message}")


def get_copier_answers() -> dict:
    """Read copier answers from .copier-answers.yml."""
    answers_file = Path(".copier-answers.yml")
    if not answers_file.exists():
        return {}

    if not HAS_YAML:
        # Fallback: simple regex parsing for key values
        content = answers_file.read_text()
        answers = {}
        for line in content.split("\n"):
            match = re.match(r"^(\w+):\s*(.+)$", line.strip())
            if match:
                key, value = match.groups()
                # Remove quotes if present
                value = value.strip("'\"")
                answers[key] = value
        return answers

    with open(answers_file) as f:
        return yaml.safe_load(f) or {}


def replace_placeholders() -> None:
    """Replace __PROJECT_NAME__ placeholders in source files."""
    log_step("Step 1/4: Replacing Placeholders")

    answers = get_copier_answers()
    project_name = answers.get("project_name", "My App")

    # Find all TSX/TS files with placeholders
    replaced_count = 0
    for pattern in ("**/*.tsx", "**/*.ts"):
        for path in Path(".").glob(pattern):
            if "node_modules" in str(path):
                continue
            content = path.read_text()
            if "__PROJECT_NAME__" in content:
                new_content = content.replace("__PROJECT_NAME__", project_name)
                path.write_text(new_content)
                replaced_count += 1
                log_success(f"Replaced placeholder in {path}")

    if replaced_count == 0:
        log_warning("No placeholders found to replace")
    else:
        log_success(f"Replaced placeholders in {replaced_count} files")


def copy_env_file() -> None:
    """Copy .env.example to .env if it doesn't exist."""
    log_step("Step 2/4: Environment Configuration")

    env_example = Path(".env.example")
    env_file = Path(".env")

    if not env_example.exists():
        log_warning(".env.example not found - skipping")
        return

    if env_file.exists():
        log_warning(".env already exists - skipping copy")
        return

    try:
        shutil.copy2(env_example, env_file)
        log_success("Created .env from .env.example")
        log_warning("Edit .env to configure your API URL")
    except Exception as exc:
        log_error(f"Failed to copy .env.example: {exc}")


def run_npm_install() -> None:
    """Install dependencies using npm install."""
    log_step("Step 3/4: Install Dependencies")

    npm_path = shutil.which("npm")
    if not npm_path:
        log_warning("npm not found - skipping dependency installation")
        log_warning("Install Node.js: https://nodejs.org/")
        log_warning("Then run: npm install")
        return

    try:
        subprocess.run(
            [npm_path, "install"],
            check=True,
            capture_output=True,
            text=True,
        )
        log_success("Dependencies installed successfully")
    except subprocess.CalledProcessError as exc:
        log_error(f"Failed to install dependencies: {exc}")
        if exc.stderr:
            print(exc.stderr, file=sys.stderr)
        log_warning("You can manually install later with: npm install")
    except Exception as exc:
        log_error(f"Unexpected error during npm install: {exc}")


def init_git() -> None:
    """Initialize git repository if not already initialized."""
    log_step("Step 4/4: Git Repository")

    git_dir = Path(".git")
    if git_dir.exists():
        log_warning("Git repository already exists - skipping init")
        return

    git_path = shutil.which("git")
    if not git_path:
        log_warning("git not found - skipping repository initialization")
        return

    try:
        subprocess.run(
            [git_path, "init"],
            check=True,
            capture_output=True,
            text=True,
        )
        log_success("Initialized git repository")

        subprocess.run(
            [git_path, "add", "."],
            check=True,
            capture_output=True,
            text=True,
        )

        subprocess.run(
            [git_path, "commit", "-m", "Initial commit from mobile-template"],
            check=True,
            capture_output=True,
            text=True,
        )
        log_success("Created initial commit")
    except subprocess.CalledProcessError as exc:
        log_error(f"Failed to initialize git: {exc}")
        if exc.stderr:
            print(exc.stderr, file=sys.stderr)
    except Exception as exc:
        log_error(f"Unexpected error during git init: {exc}")


def main() -> int:
    """Run all post-generation tasks.

    Returns:
        Always returns 0 - failures are informational, not critical
    """
    print("\n" + "=" * 60)
    print("  Mobile Template - Post-Generation Setup")
    print("=" * 60)

    replace_placeholders()
    copy_env_file()
    run_npm_install()
    init_git()

    print("\n" + "=" * 60)
    print("  Post-generation setup complete!")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())
