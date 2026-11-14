# Third-party: Vexo open kit (JS client)

`vexo-open-kit/` holds a **vendored copy** of the official kit’s browser JS client
(`js/src`) plus its MIT `LICENSE`.

- Upstream: https://github.com/VexoAI-Org/vexo-open-kit.git  
- Do **not** edit files under `vexo-open-kit/js/src` — refresh from the sibling clone when needed:

  ```bat
  robocopy ..\vexo-open-kit\js\src third_party\vexo-open-kit\js\src /MIR
  copy ..\vexo-open-kit\LICENSE third_party\vexo-open-kit\LICENSE
  ```

- Worvo keeps this copy inside the app so Next/Turbopack can resolve modules (sibling junctions leave the filesystem root and fail the build).
- Full kit (dashboard, Python, examples) stays as the sibling `../vexo-open-kit` for local hardware testing — not a second application lockfile.
