---
name: No patches on top of patches
description: User wants root-cause fixes, not layered band-aids. Audit first, fix once.
type: feedback
---

Do not add incremental patches on top of existing broken code. When something isn't working, stop, read ALL relevant files, identify the actual root cause, then make one clean fix.

**Why:** Multiple rounds of "fixes on top of fixes" were applied to the profile screen (null guards, then ErrorBoundary, then more try/catch) without ever finding the root cause. User explicitly called this out.

**How to apply:** Before writing any fix, read every file involved in the failure path. State the root cause explicitly before changing any code. If unsure of the root cause, add diagnostic logging and wait for the user to report results — do not guess and patch.
