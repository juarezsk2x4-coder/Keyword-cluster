# Installing graphify

`graphify` is distributed on PyPI as the **`graphifyy`** package. Pick whichever
installer you already have — they all give you the same `graphify` command.

## Recommended: uv

`uv` installs the tool into an isolated environment and puts `graphify` on your
`PATH` automatically, so it just works after install:

```bash
uv tool install graphifyy
```

Verify:

```bash
graphify --version
```

Don't have `uv`? Install it first:

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

## Alternatives

### pipx

`pipx` also isolates the tool and manages the `PATH` entry for you:

```bash
pipx install graphifyy
```

If `graphify` isn't found afterwards, run `pipx ensurepath` once and reopen your
shell.

### pip

```bash
pip install graphifyy
```

This installs into the active Python environment. It works, but `pip` does not
manage your `PATH` the way `uv` and `pipx` do — see the note below if the
command isn't found.

## Note: `pip` and your PATH

When you `pip install` a tool, the `graphify` executable is placed in your
Python installation's *scripts* directory. If that directory isn't on your
`PATH`, your shell won't find the command even though it installed fine.

1. Find where it landed:

   ```bash
   python -m site --user-base   # scripts live in <that path>/bin (or Scripts on Windows)
   pip show -f graphifyy        # lists installed files, including the executable
   ```

2. Add the scripts directory to your `PATH`:

   - **macOS / Linux (bash/zsh)** — add to `~/.bashrc` or `~/.zshrc`:

     ```bash
     export PATH="$(python -m site --user-base)/bin:$PATH"
     ```

   - **Windows (PowerShell)** — add the `Scripts` folder shown by
     `pip show -f graphifyy` to your `Path` environment variable.

3. Reopen your shell and confirm:

   ```bash
   graphify --version
   ```

If you'd rather not deal with `PATH` at all, use `uv tool install graphifyy` or
`pipx install graphifyy` — both handle it for you.

You can always invoke the tool without touching `PATH`:

```bash
python -m graphify --version
```
