# dependency-cruiser fixtures

A tiny fake `src/` tree with **one deliberate violation per layer rule** in `.dependency-cruiser.cjs`, plus allowed imports that must not be reported. A unit test runs dependency-cruiser here with the root config and asserts the exact set of violations, which proves the rules work.

Never import these files from the app.
