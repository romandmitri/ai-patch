# `@romandmitri/ai-patch`

This package is designed to do diff-based updates and play well with Vercel AI SDK, but can probably used with other LLM text generators.

I do NOT see any off-the-shelf solutions available that bridge the gap for updating large prompt files. The naive approach is to output the modified prompt as a
whole, but that takes time and output tokens. The more-efficient approach is diff-based updates that target only the sections that need to change.
