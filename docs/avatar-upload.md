# Avatar upload (Cloudinary) — Backend API

Short instructions for frontend and testing.

## Endpoint
- POST /api/share/auth/users/:user_code/avatar
  - Protected by `authMiddleware`.
  - Multipart form-data with one field `avatar` containing the image file.

## Requirements
- Allowed types: image/jpeg, image/png, image/webp
- Max file size: 5 MB (server validates)
- Backend uploads file to Cloudinary, stores `user_avatar` (secure_url) and `user_avatar_public_id` on `users` table.
- Only the user themselves or admins can update another user's avatar.

## Environment
Set Cloudinary credentials in `.env` using:
- Option A (recommended):
  - CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
- Option B:
  - CLOUDINARY_CLOUD_NAME=<cloud_name>
  - CLOUDINARY_API_KEY=<api_key>
  - CLOUDINARY_API_SECRET=<api_secret>

## Sample FE request (Axios)
```js
const fd = new FormData();
fd.append('avatar', file);

axios.post(`/api/share/auth/users/${userCode}/avatar`, fd, {
  headers: {
    // include token if needed
    Authorization: `Bearer ${token}`
  }
})
.then(res => console.log('Updated', res.data.user))
.catch(err => console.error(err.response?.data || err.message));
```

## Response (example)
```json
{ "message": "Avatar cập nhật thành công", "user": { "user_id": 1, "user_code": "...", "user_avatar": "https://...", "user_avatar_public_id": "users/avatars/abc123" } }
```

## Notes
- When a new avatar is uploaded the old one is removed from Cloudinary (if present) automatically.
- The backend uses `utils/uploadAvatar.js` (multer memory storage) and `config/cloudinary.js` for config.
- Make sure to run `npm install` after pulling these changes to install `cloudinary`.
