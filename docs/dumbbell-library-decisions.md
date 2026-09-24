# Dumbbell library scope decisions

The dumbbell system favors movements that can be coached clearly from a phone at the rack. It does not add a second ID when an existing stable exercise ID already represents the movement.

## Intentionally not added as separate exercises

- **Dumbbell stiff-leg deadlift:** not a separate default exercise. The library already has Dumbbell Romanian Deadlift, which is easier to standardize around a controlled hip hinge and soft knees. “Stiff-leg” naming often encourages people to lock the knees or chase floor depth. A coach can record a technique note without fragmenting history into a near-duplicate ID.
- **Weighted dumbbell sit-up:** not a default exercise. Loading position, spinal tolerance, bench anchoring and progression vary too much for one concise prescription. The library keeps Russian Twist, Dead Bug, Plank Drag and carry options, and does not imply that loaded spinal flexion is required for core development.
- **Single-arm farmer carry:** represented by the stable `db_suitcase_carry` ID. It is the same one-sided carry concept; a duplicate would split history and personal records.
- **Dumbbell pullover under Back:** represented once by `db_pullover`, with chest and lats documented in its muscle metadata. Duplicating it by body-part category would split progression history.
- **Renegade row under Full Body:** represented once by `db_renegade_row` and discoverable through its Back family, core muscles, plank-row pattern and search terms.

## Conditional movements retained with cautions

- **Dumbbell decline press:** available only when a purpose-built secure decline bench and controlled handoff/dismount are practical. Flat pressing is the default alternative.
- **Dumbbell seal row:** retained as an intermediate, setup-dependent variation. The guide requires a stable elevated bench arrangement and tells the user to choose a chest-supported row when the setup would be improvised.
- **Dumbbell upright row:** retained only as a light, shoulder-friendly accessory: neutral wrist, elbows no higher than a comfortable shoulder level, and immediate substitution when the path pinches. It is not programmed as a primary strength lift.
- **Dumbbell RDL-to-row combination:** retained as an optional advanced full-body/conditioning movement, explicitly not a primary strength exercise.

These decisions preserve useful variety without inflating the count with duplicate, ambiguous or difficult-to-standardize entries.
