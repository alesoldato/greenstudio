# Green Studio site

The complete static site is in `dist/`. No build command or package installation is needed.

## GitHub Pages

GitHub Pages publishes the root of the `gh-pages` branch. The branch is generated from `dist/`, so site assets remain relative and work at `https://alesoldato.github.io/greenstudio/`.

To publish a later update after committing changes to `dist/` on `main`:

```sh
git push github main
site_commit=$(git subtree split --prefix=dist main)
git push github "$site_commit":refs/heads/gh-pages
```

In the GitHub repository's **Settings → Pages**, select **Deploy from a branch**, then choose `gh-pages` and `/(root)`.
