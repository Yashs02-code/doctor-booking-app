/**
 * GOOGLE SHEETS SYNC SCRIPT - SMART UPDATE VERSION
 * -----------------------------------------
 * This script receives data from your Medi AI app and:
 * 1.  Checks if the appointment with the same 'Appointment ID' already exists.
 * 2.  If it exists, updates the 'Status', 'Date', and 'Time'.
 * 3.  If it doesn't exist, appends a new row.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Extract data fields from the app
    var id = data.id || "N/A";
    var patientName = data.patientName || "N/A";
    var doctorName = data.doctorName || "N/A";
    var date = data.date || "N/A";
    var time = data.time || "N/A";
    var status = data.status || "confirmed";
    var bookedAt = data.bookedAt || new Date().toISOString();
    var symptoms = data.symptoms || "N/A";
    var age = data.age || "N/A";
    var gender = data.gender || "N/A";
    var type = data.appointmentType || "General Check-up";

    // ✅ FIND EXISTING ROW BY APPOINTMENT ID (Column B)
    var lastRow = sheet.getLastRow();
    var foundIndex = -1;
    
    if (lastRow > 1) {
      // Get all values in Column B (Appointment ID)
      var ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] === id) {
          foundIndex = i + 2; // +2 because 0-based index and header row
          break;
        }
      }
    }

    if (foundIndex > -1) {
      // ✅ UPDATE EXISTING ROW (Date, Time, Status)
      sheet.getRange(foundIndex, 7).setValue(date);   // Col G: Date
      sheet.getRange(foundIndex, 8).setValue(time);   // Col H: Time
      sheet.getRange(foundIndex, 9).setValue(status); // Col I: Status
      
      return ContentService.createTextOutput(JSON.stringify({"result": "updated", "row": foundIndex}))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // ✅ APPEND NEW ROW
      var row = [
        bookedAt,      // A: Booked At
        id,            // B: Appointment ID
        patientName,   // C: Patient Name
        age,           // D: Age
        gender,        // E: Gender
        doctorName,    // F: Doctor Name
        date,          // G: Date
        time,          // H: Time
        status,        // I: Status
        type,          // J: Type
        symptoms       // K: Symptoms / Description
      ];
      sheet.appendRow(row);
      
      return ContentService.createTextOutput(JSON.stringify({"result": "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("✅ Medi AI Smart Sync is Running.");
}
