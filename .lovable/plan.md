

This is a straightforward single-file edit to append environment variable entries to `.gitignore`.

**Change:** Add the following block at the end of `.gitignore`:

```
# Environment variables
.env
.env.local
.env.*.local
```

Note: `*.local` on line 13 already covers `.env.local` and `.env.*.local`, but adding them explicitly is fine for clarity and intent. The key addition is `.env` itself, which is not currently ignored.

