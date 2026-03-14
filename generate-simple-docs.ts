import PDFDocument from "pdfkit";
import fs from "fs";

function generateSimpleWorkstationGuide() {
  const doc = new PDFDocument({
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    size: "A4",
  });

  const outputPath = "Workstation_Quick_Guide.pdf";
  doc.pipe(fs.createWriteStream(outputPath));

  // Helper functions
  const addHeader = (text: string, fontSize = 22) => {
    doc
      .fontSize(fontSize)
      .font("Helvetica-Bold")
      .text(text, { align: "center" })
      .moveDown(0.8);
  };

  const addSubHeader = (text: string) => {
    doc.fontSize(14).font("Helvetica-Bold").text(text).moveDown(0.4);
  };

  const addText = (text: string) => {
    doc.fontSize(11).font("Helvetica").text(text).moveDown(0.4);
  };

  const addNumberedStep = (number: number, text: string) => {
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(`${number}. `, { continued: true })
      .font("Helvetica")
      .text(text)
      .moveDown(0.3);
  };

  const addBullet = (text: string) => {
    doc.fontSize(11).font("Helvetica").text(`   • ${text}`).moveDown(0.25);
  };

  // TITLE
  doc.moveDown(2);
  addHeader("Workstation Booking System", 26);
  addHeader("Student Quick Guide", 20);
  doc.moveDown(1);

  // SECTION 1: WORKSTATION CATEGORIES
  addSubHeader("Available Workstation Categories");
  doc.moveDown(0.2);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("1. Graphics")
    .font("Helvetica")
    .fontSize(10)
    .text("   For basic computing, document work, and general graphic tasks")
    .moveDown(0.4);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("2. Graphics and Editing")
    .font("Helvetica")
    .fontSize(10)
    .text("   For photo editing, video editing, and design work")
    .moveDown(0.4);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("3. 3D & FX")
    .font("Helvetica")
    .fontSize(10)
    .text(
      "   For 3D modeling, animation, rendering, and special effects work"
    )
    .moveDown(0.8);

  // SECTION 2: HOW TO USE
  addSubHeader("How to Use the Workstation Booking System");
  doc.moveDown(0.3);

  addNumberedStep(
    1,
    "Access the Website - Open your browser and go to the Workstation Portal"
  );
  addNumberedStep(2, "Login - Click 'Book Now' and enter your student email and password");
  addNumberedStep(
    3,
    "Select Date and Time - Choose Today or Tomorrow, then pick your time slot"
  );
  addNumberedStep(
    4,
    "Choose Duration - Select how long you need (15 minutes to 3 hours)"
  );
  addNumberedStep(
    5,
    "Pick Category - Select Graphics, Graphics and Editing, or 3D & FX"
  );
  addNumberedStep(
    6,
    "Choose Computer - Pick an available computer from the list"
  );
  addNumberedStep(
    7,
    "Book Now - Click the 'Book Now' button and get instant confirmation"
  );
  addNumberedStep(
    8,
    "Arrive on Time - Come to the lab and use your booked computer"
  );

  doc.moveDown(0.6);

  // SECTION 3: IMPORTANT RULES
  addSubHeader("Important Rules");
  doc.moveDown(0.2);

  addBullet("Daily Time Limit: 3 hours maximum per day");
  addBullet("Operating Hours: 9:00 AM to 7:00 PM (Monday to Saturday)");
  addBullet("Closed: Sundays and holidays");
  addBullet("Minimum Booking: 15 minutes");
  addBullet("Maximum Booking: 3 hours per session");
  addBullet("Auto-Logout: System logs you out after 5 minutes of inactivity");

  doc.moveDown(0.6);

  // SECTION 4: QUICK TIPS
  addSubHeader("Quick Tips");
  doc.moveDown(0.2);

  addBullet("Book in advance to secure your preferred time");
  addBullet("Check your remaining daily hours at the top of the page");
  addBullet("Arrive 5 minutes early for your booking");
  addBullet("Use the 'My Bookings' tab to see all your reservations");
  addBullet("Save your work regularly during your session");
  addBullet("Log out and clean up when finished");

  doc.moveDown(0.8);

  // SECTION 5: BOOKING STATUS
  addSubHeader("Understanding Booking Status");
  doc.moveDown(0.2);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text("   • Active - Your current ongoing booking")
    .moveDown(0.2);
  doc.text("   • Pending - Upcoming future booking").moveDown(0.2);
  doc.text("   • Completed - Past booking that has ended").moveDown(0.2);
  doc.text("   • Cancelled - Booking was cancelled").moveDown(0.5);

  // TROUBLESHOOTING (continues on same page or flows to next)
  addHeader("Troubleshooting & Contact", 20);
  doc.moveDown(0.2);

  // COMMON ISSUES
  addSubHeader("Common Issues");

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Cannot Login?")
    .font("Helvetica")
    .fontSize(10)
    .text("   Check your email and password. Contact admin if account is disabled.")
    .moveDown(0.2);

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("No Computers Available?")
    .font("Helvetica")
    .fontSize(10)
    .text("   Try a different time slot or check tomorrow's availability.")
    .moveDown(0.2);

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Cannot Select Duration?")
    .font("Helvetica")
    .fontSize(10)
    .text(
      "   Check your daily time limit. Options are limited by remaining time."
    )
    .moveDown(0.2);

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Book Button Disabled?")
    .font("Helvetica")
    .fontSize(10)
    .text(
      "   Ensure all fields are selected and computer is still available."
    )
    .moveDown(0.3);

  // BOOKING FLOW DIAGRAM (TEXT VERSION)
  addSubHeader("Complete Booking Flow");

  const flowSteps = [
    "Open Website",
    "Click 'Book Now'",
    "Login with Email & Password",
    "Select Date (Today/Tomorrow)",
    "Choose Time Slot (9 AM - 6:30 PM)",
    "Select Duration (15 min - 3 hours)",
    "Pick Category (Graphics / Graphics & Editing / 3D & FX)",
    "Choose Available Computer",
    "Click 'Book Now' Button",
    "Get Confirmation",
    "Arrive at Lab on Time",
    "Use Your Booked Computer",
  ];

  flowSteps.forEach((step, index) => {
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`${index + 1}. ${step}`)
      .moveDown(0.1);
  });

  doc.moveDown(0.3);

  // WHAT TO REMEMBER
  addSubHeader("What to Remember");

  addBullet("Your booking is confirmed instantly");
  addBullet("Computer updates in real-time (you will see if it gets booked)");
  addBullet("Your usage time updates every 5 seconds");
  addBullet("System is available Monday to Saturday only");
  addBullet("Be on time - others may be waiting after you");

  doc.moveDown(0.4);

  // CONTACT INFO
  addSubHeader("Need Help?");
  doc
    .fontSize(11)
    .font("Helvetica")
    .text("Contact the Lab Administrator or IT Support for assistance.")
    .moveDown(0.3);

  // FOOTER
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Thank you for using the Workstation Booking System!", {
      align: "center",
    });
  doc
    .fontSize(9)
    .font("Helvetica")
    .text("IAGA Workstation Portal", { align: "center" });

  doc.end();

  console.log(`✅ Simple guide generated: ${outputPath}`);
  return outputPath;
}

// Run the generator
try {
  const pdfPath = generateSimpleWorkstationGuide();
  console.log(`📄 Quick guide created successfully at: ${pdfPath}`);
  console.log(`📖 The PDF is concise (1-2 pages) with clear flow`);
} catch (error) {
  console.error("❌ Error generating PDF:", error);
  process.exit(1);
}
