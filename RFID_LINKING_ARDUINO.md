# RFID Linking - Arduino Code Changes

To enable RFID linking functionality, you need to add the following code to your Arduino sketch (`DropPointSmartWaste.ino`).

## 1. Add Global Variables (after line ~191)

```cpp
// RFID Linking
bool rfidLinkingMode = false;
String linkingUserId = "";
unsigned long lastRfidLinkCheck = 0;
constexpr unsigned long RFID_LINK_CHECK_INTERVAL_MS = 2000UL;  // Check every 2 seconds
```

## 2. Add Function Declarations (after line ~250)

```cpp
bool checkRfidLinkingRequests();
void handleRfidLinkingMode();
bool linkRfidToUser(const String &uid, const String &userId);
```

## 3. Add Functions (before `void loop()`)

```cpp
// Check Firebase for RFID linking requests
bool checkRfidLinkingRequests() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  String url = String(FIREBASE_DATABASE_URL) + "/rfidLinking.json";
  
  if (strlen(FIREBASE_AUTH_TOKEN) > 0) {
    url += "?auth=" + String(FIREBASE_AUTH_TOKEN);
  }

  http.begin(url);
  http.setTimeout(3000);
  int responseCode = http.GET();

  if (responseCode == 200) {
    String response = http.getString();
    http.end();

    // Parse JSON response to find any active linking request
    // Look for entries with "requested": true
    if (response.indexOf("\"requested\":true") >= 0) {
      // Extract userId from the path (simplified - you may need better JSON parsing)
      int userIdStart = response.indexOf("\"") + 1;
      int userIdEnd = response.indexOf("\"", userIdStart + 1);
      if (userIdStart > 0 && userIdEnd > userIdStart) {
        linkingUserId = response.substring(userIdStart, userIdEnd);
        rfidLinkingMode = true;
        showLCDMessage("Please scan", "your new id");
        DEBUG_PRINTLN(F("[RFID Link] Linking mode activated for user: ") + linkingUserId);
        return true;
      }
    }
  }

  http.end();
  return false;
}

// Handle RFID linking mode
void handleRfidLinkingMode() {
  if (!rfidLinkingMode) return;

  String scannedUid;
  if (readRFID(scannedUid)) {
    // Link the RFID to the user
    if (linkRfidToUser(scannedUid, linkingUserId)) {
      showLCDMessage("Link", "Successful!");
      playSuccessTone();
      delay(2000);
      showReadyScreen();
    } else {
      showLCDMessage("Link", "Failed!");
      playErrorTone();
      delay(2000);
      showReadyScreen();
    }
    
    // Clear linking mode
    rfidLinkingMode = false;
    linkingUserId = "";
    
    // Clear the Firebase request
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String url = String(FIREBASE_DATABASE_URL) + "/rfidLinking/" + linkingUserId + ".json";
      if (strlen(FIREBASE_AUTH_TOKEN) > 0) {
        url += "?auth=" + String(FIREBASE_AUTH_TOKEN);
      }
      http.begin(url);
      http.setTimeout(3000);
      http.sendRequest("DELETE", "");
      http.end();
    }
  }
}

// Link RFID UID to user in Firebase
bool linkRfidToUser(const String &uid, const String &userId) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  String url = String(FIREBASE_DATABASE_URL) + "/users/" + userId + "/rfidUid.json";
  
  if (strlen(FIREBASE_AUTH_TOKEN) > 0) {
    url += "?auth=" + String(FIREBASE_AUTH_TOKEN);
  }

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  String payload = "\"" + uid + "\"";
  int responseCode = http.PUT(payload);

  bool success = (responseCode == 200 || responseCode == 201);
  http.end();

  if (success) {
    DEBUG_PRINTLN(F("[RFID Link] Successfully linked UID ") + uid + F(" to user ") + userId);
  } else {
    DEBUG_PRINTLN(F("[RFID Link] Failed to link RFID. Response: ") + String(responseCode));
  }

  return success;
}
```

## 4. Update `void loop()` (around line 308)

Add this before the switch statement:

```cpp
void loop() {
  esp_task_wdt_reset();

  maintainWiFi();
  flushPendingUpdates();
  handleServoReturn();

  // Check for RFID linking requests periodically (only when idle)
  if (systemState == SystemState::Idle && !rfidLinkingMode) {
    if (millis() - lastRfidLinkCheck >= RFID_LINK_CHECK_INTERVAL_MS) {
      checkRfidLinkingRequests();
      lastRfidLinkCheck = millis();
    }
  }

  // Handle RFID linking mode (has priority over normal operation)
  if (rfidLinkingMode) {
    handleRfidLinkingMode();
    return;  // Skip normal state machine when in linking mode
  }

  // Display sensor warnings every 5 seconds
  if (millis() - lastWarningDisplay >= 5000) {
    displaySensorWarnings();
    lastWarningDisplay = millis();
  }

  switch (systemState) {
    // ... rest of the code
  }
}
```

## Notes

- The code checks Firebase every 2 seconds for linking requests
- When a request is found, it enters linking mode and shows "Please scan your new id" on LCD
- After scanning, it writes the UID to `/users/{userId}/rfidUid` in Firebase
- The linking request is then cleared from Firebase

Make sure your Firebase database rules allow read/write access to `/rfidLinking` and `/users/{userId}/rfidUid` paths.

