# 96 Research

Minimalist static website for publishing equity research, market commentary, and media appearances.

## File Structure

```
96research/
├── index.html            Homepage
├── archive.html          Chronological archive of all posts
├── article.html          Article template (renders markdown via JS)
├── css/
│   └── style.css         All styles
├── js/
│   └── main.js           Article loading + markdown renderer
├── articles/
│   ├── articles.json     Article index (add entries here)
│   └── *.md              Markdown article files
└── README.md
```

## Adding a New Article

1. **Write the article** as a markdown file in `articles/`:

   ```
   articles/my-article-slug.md
   ```

2. **Add an entry** to `articles/articles.json`:

   ```json
   {
     "slug": "my-article-slug",
     "title": "My Article Title",
     "date": "2025-03-15",
     "category": "equity-research",
     "description": "A short summary of the article."
   }
   ```

   Valid categories: `equity-research`, `market-commentary`, `media`

3. **Deploy** — push to GitHub and the article is live.

The markdown file name must match the `slug` field exactly.

## Markdown Support

The built-in renderer supports:

- Headings (`## H2` through `###### H6`)
- Bold, italic, inline code
- Links and images
- Unordered and ordered lists
- Blockquotes
- Fenced code blocks
- Tables
- Horizontal rules
- YAML front-matter (stripped automatically)

## Local Development

Serve the site locally with any static file server:

```bash
# Python
python -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000`.

> **Note:** Opening `index.html` directly as a file will not work because the site uses `fetch()` to load articles. You need a local HTTP server.

## GitHub Pages Deployment

1. Create a GitHub repository.

2. Push this directory to the `main` branch:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
   git push -u origin main
   ```

3. Go to **Settings → Pages** in your repository.

4. Under **Source**, select **Deploy from a branch**.

5. Select the `main` branch and `/ (root)` folder. Click **Save**.

6. Your site will be live at `https://YOUR_USER.github.io/YOUR_REPO/` within a few minutes.

### Custom Domain (Optional)

1. In **Settings → Pages → Custom domain**, enter your domain.
2. Add a `CNAME` file to the repo root containing your domain:
   ```
   research.yourdomain.com
   ```
3. Configure DNS: add a CNAME record pointing to `YOUR_USER.github.io`.

## Design

- **Body text:** Source Serif 4 (serif)
- **Headings & UI:** Inter (sans-serif)
- **Colors:** Black on white, minimal accents
- **Layout:** Single column, 640px max-width
- **Responsive:** Mobile-first, adapts to all screen sizes

## License

All rights reserved.
