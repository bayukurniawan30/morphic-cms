# Morphic CMS Release Notes - v1.2.3

This release introduces major enhancements to the media library experience, resolves a critical issue with nested media selectors inside Repeater fields, and expands supported database schema input controls.

## Features and Improvements

### Media Library & Uploads
- **Multiple File Upload Support**: Enhanced the Media Library to support concurrent multi-file uploads (up to a maximum of 5 files at a time).
- **Progress Stability & Safe UI Controls**: The "Upload" and "New Folder" actions are now disabled during upload sessions to prevent double submission errors or active navigation interrupts.
- **Concurrent Streamlined Refreshes**: Files are uploaded in parallel and the grid is updated atomically once all uploads have settled, reducing layout shifts.
- **SVG Support**: Explicitly verified and supported `.svg` formats using system image-dialog bindings, fully supported in both AWS S3 and Cloudinary storage engines.

### Schema Input Fields
- **Boolean Support via Switch Toggle**: Resolved the `Unsupported field type: boolean` warning by implementing a premium, fully accessible toggle switch component inside collection entries.

### Bug Fixes
- **Nested Media Picker in Repeater (Array) Fields**: Fixed a state-handling bug in the Form Repeater where images selected from the media picker modal inside a nested array did not populate back into the Repeater field rows.
