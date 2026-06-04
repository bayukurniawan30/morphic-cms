# Morphic CMS Release Notes - v1.2.6

This release introduces Nested Fields (Repeater) reordering capabilities inside the Collection Schema Builder, allowing administrators to swap sub-field items up and down to adjust their order.

## Features and Improvements

### Collection Schema Builder
- **Nested Field Reordering (Repeater)**: Added Move Up and Move Down chevron buttons for Array/Repeater sub-field items.
- **State Swapping Logic**: Swapping sub-fields updates the React hook state dynamically, ensuring that label, name, type, and required validation rules remain intact when order changes.
- **Auto-boundary Disabling**: Chevron buttons are intelligently disabled at the boundaries (Up is disabled for the first sub-field, and Down is disabled for the last sub-field) to prevent index out of bounds.
- **Grid Layout Refinement**: Shifted columns from a `3-3-3-2-1` layout to a balanced `1-3-2-3-2-1` column structure, adding reorder controls cleanly while preserving name and label readability.
