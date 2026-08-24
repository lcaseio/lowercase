# Prove Swappable Infrastructure

## Summary

The ports/adapters boundary is meant to let other infrastructure backends get swapped in later (candidates already named in the root `README.md`: Redis Streams for the job queue, MinIO for CAS/blob storage) — but that's only a structural claim until a second real implementation actually exists behind one of those ports. Implement one real alternate adapter to prove the boundary holds under a real second implementation, not just in theory.

Deliberately sequenced last in this arc, once the boundaries it's testing are actually stable.

Scaffolded now, work not yet started.
