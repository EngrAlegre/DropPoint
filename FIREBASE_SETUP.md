# Firebase Database Setup Guide

## Database Structure

Your Firebase Realtime Database should have this structure:

```
{
  "users": {
    "[userId]": {
      "email": "user@example.com",
      "points": 435,
      "createdAt": 1234567890
    }
  },
  "disposals": {
    "[userId]": {
      "[timestamp]": {
        "type": "bio" or "nonbio",
        "points": 1,
        "timestamp": 1234567890
      }
    }
  },
  "storeItems": {
    "[itemId]": {
      "name": "Pencil Set (12 pack)",
      "category": "Writing",
      "points": 50,
      "stock": 10,  // number for limited stock, "unlimited" for unlimited
      "icon": "✏️"
    }
  },
  "redemptions": {
    "[userId]": {
      "[redemptionId]": {
        "itemId": "item1",
        "itemName": "Pencil Set (12 pack)",
        "points": 50,
        "verificationCode": "58093414",
        "timestamp": 1234567890,
        "status": "pending" or "collected"
      }
    }
  }
}
```

## Initial Setup Steps

### 1. Enable Authentication

1. Go to Firebase Console → Authentication
2. Enable "Email/Password" sign-in method
3. Create admin user accounts

### 2. Set Database Rules

Go to Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()"
      }
    },
    "disposals": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()",
        ".write": true
      }
    },
    "storeItems": {
      ".read": true,
      ".write": "root.child('admins').child(auth.uid).exists()"
    },
    "redemptions": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()",
        ".write": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()"
      }
    }
  }
}
```

### 3. Add Store Items

Add items to `storeItems` in Firebase:

```json
{
  "storeItems": {
    "item1": {
      "name": "Pencil Set (12 pack)",
      "category": "Writing",
      "points": 50,
      "stock": 10,
      "icon": "✏️"
    },
    "item2": {
      "name": "Notebook (80 pages)",
      "category": "Paper",
      "points": 75,
      "stock": 20,
      "icon": "📓"
    }
  }
}
```

### 4. User Points Sync

User points are automatically calculated from disposals. The ESP32 sends disposal data to `/disposals/{uid}/{timestamp}`, and the web app calculates total points.

## Notes

- Stock: Use number (e.g., 10) for limited stock, or "unlimited" for unlimited items
- Points: Automatically deducted when user redeems
- Redemptions: Tracked with verification codes for collection

