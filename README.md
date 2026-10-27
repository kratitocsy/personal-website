# aryansengar.wynko.in

Personal website of Aryan Singh Sengar. Plain HTML/CSS/JS, no build step.

- `index.html` – all page content
- `styles.css` – styling
- `script.js` – scroll animations
- `assets/` – images (Maglion logo and concept art from the pitch deck)

## Preview locally

```
python3 -m http.server 8000
```
then open http://localhost:8000

## Hosting on aryansengar.wynko.in (GitHub Pages)

1. Merge this into the default branch.
2. Repo **Settings → Pages**: Source = "Deploy from a branch", branch = `main`, folder = `/ (root)`.
3. At your DNS provider for `wynko.in`, add a record:
   - Type `CNAME`, Name `aryansengar`, Value `kratitocsy.github.io`
4. Back in **Settings → Pages**, confirm the custom domain is `aryansengar.wynko.in` (the `CNAME` file sets it) and tick **Enforce HTTPS** once the certificate is issued.

Vercel or Netlify also work: import the repo, no build command, output directory `/`, then add `aryansengar.wynko.in` as a domain and point the same `CNAME` record at the value they give you.
