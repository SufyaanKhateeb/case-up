# Parted FBX review

The supplied full_body_model_parted.fbx has 18 independently selectable meshes, no UVs, no armature and no facial shape keys. Its constant vertex colors label segments.

The material review is prepared by scripts/character/prepare-parted-fbx.py, with the untouched import and full-density palette copy preserved under artifacts/character/parted-fbx/. The web GLB has 158,991 triangles and local Draco compression. The source has 1,033,175 triangles.

Head, eyes, eye details, brows, moustache, beard, sleeves and hands are separate. The mouth/lips remain part of the head. The hair shell also contains the neck; it is not a clean standalone neck object. A rigid head pivot test groups the head-facing pieces, while the part selector and separation slider expose this structure.

The walking FBX supplied afterward is the more useful body-animation source. See ../rigged-fbx/README.md and /character/rigged for its colored, skinned review.
