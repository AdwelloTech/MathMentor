# MathMentor Testing Endpoints

## Backend URL
```
http://72.60.20.140:5001/
```

## Accept All Pending Tutor Applications

This endpoint automatically approves all tutor applications that are currently pending.

```bash
curl -X POST http://72.60.20.140:5001/api/tutors/applications/accept-all
```

**Response:**
```json
{
  "success": true,
  "message": "Accepted X tutor applications",
  "data": {
    "acceptedCount": X,
    "totalProcessed": X
  }
}
```

## Accept All Pending ID Verifications

This endpoint automatically approves all ID verification submissions that are currently pending.

```bash
curl -X POST http://72.60.20.140:5001/api/tutors/id-verification/accept-all
```

**Response:**
```json
{
  "success": true,
  "message": "Accepted X ID verifications",
  "data": {
    "acceptedCount": X,
    "totalProcessed": X
  }
}
```

## Usage Notes

- These endpoints accept ALL pending items at once
- No authentication required
- Users will be automatically granted tutor access after application approval
- Use these endpoints during testing to quickly populate the system with approved tutors