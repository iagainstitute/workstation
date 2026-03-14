import PDFDocument from "pdfkit";
import fs from "fs";

function generateWorkstationDocumentation() {
  const doc = new PDFDocument({
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    size: "A4",
  });

  const outputPath = "Workstation_Student_Guide.pdf";
  doc.pipe(fs.createWriteStream(outputPath));

  // Helper function for headers
  const addHeader = (text: string, fontSize = 24) => {
    doc
      .fontSize(fontSize)
      .font("Helvetica-Bold")
      .text(text, { align: "center" })
      .moveDown(1);
  };

  // Helper function for sub-headers
  const addSubHeader = (text: string, fontSize = 18) => {
    doc.fontSize(fontSize).font("Helvetica-Bold").text(text).moveDown(0.5);
  };

  // Helper function for body text
  const addText = (text: string, options = {}) => {
    doc.fontSize(12).font("Helvetica").text(text, options).moveDown(0.5);
  };

  // Helper function for numbered list
  const addNumberedList = (items: string[]) => {
    items.forEach((item, index) => {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`${index + 1}. `, { continued: true })
        .font("Helvetica")
        .text(item)
        .moveDown(0.3);
    });
    doc.moveDown(0.5);
  };

  // Helper function for bullet list
  const addBulletList = (items: string[]) => {
    items.forEach((item) => {
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`   • ${item}`)
        .moveDown(0.3);
    });
    doc.moveDown(0.5);
  };

  // Title Page
  doc.moveDown(4);
  addHeader("Workstation Booking System", 32);
  doc.moveDown(1);
  addHeader("Student User Guide", 28);
  doc.moveDown(3);
  addText(
    "A Complete Guide to Booking and Using Computer Workstations",
    { align: "center" }
  );
  doc.moveDown(2);
  doc
    .fontSize(14)
    .font("Helvetica")
    .text("IAGA Workstation Portal", { align: "center" })
    .moveDown(0.5);
  doc
    .fontSize(12)
    .font("Helvetica")
    .text(new Date().getFullYear().toString(), { align: "center" });

  // New Page - Table of Contents
  doc.addPage();
  addHeader("Table of Contents", 24);
  doc.moveDown(0.5);

  const tocItems = [
    "1. Introduction",
    "2. System Overview",
    "3. Getting Started",
    "4. How to Book a Computer",
    "5. Computer Types",
    "6. Booking Rules and Limits",
    "7. Managing Your Bookings",
    "8. Important Information",
    "9. Troubleshooting",
    "10. Contact Information",
  ];

  tocItems.forEach((item) => {
    doc.fontSize(14).font("Helvetica").text(item).moveDown(0.5);
  });

  // Page 1 - Introduction
  doc.addPage();
  addHeader("1. Introduction");

  addSubHeader("Welcome to the Workstation Booking System");
  addText(
    "This guide will help you understand how to book and use computer workstations in our facility. The system is designed to be simple and easy to use, allowing you to reserve computers for your work, study, or projects."
  );

  addSubHeader("What You Can Do");
  addBulletList([
    "Book computers for different purposes (2D work, 3D work, gaming, design)",
    "Choose your preferred date and time",
    "Select the duration you need",
    "View all your bookings in one place",
    "Track your daily usage time",
  ]);

  addSubHeader("Who Can Use This System");
  addText(
    "This system is available to all registered students. You need to have a student account with valid login credentials to access the booking portal."
  );

  // Page 2 - System Overview
  doc.addPage();
  addHeader("2. System Overview");

  addSubHeader("How the System Works");
  addText(
    "The Workstation Booking System allows students to reserve computers in advance. The system manages all bookings automatically and ensures fair access for all students."
  );

  addSubHeader("Key Features");
  addBulletList([
    "Real-time availability checking",
    "Automatic conflict detection",
    "Daily time limit tracking",
    "Instant booking confirmation",
    "Auto-logout after 5 minutes of inactivity for security",
    "Live updates when computers get booked",
  ]);

  addSubHeader("Available Computer Types");
  addBulletList([
    "2D Workstations - For basic computing, document work, and 2D design",
    "3D Workstations - For 3D modeling, rendering, and graphics work",
  ]);

  // Page 3 - Getting Started
  doc.addPage();
  addHeader("3. Getting Started");

  addSubHeader("Accessing the System");
  addText(
    "To access the workstation booking system, you need to follow these steps:"
  );

  addNumberedList([
    "Open your web browser (Chrome, Firefox, or Edge recommended)",
    "Go to the Workstation Portal website",
    "Click on the 'Book Now' button on the home page",
    "You will be directed to the student login page",
  ]);

  addSubHeader("Logging In");
  addText("To log in to your student account:");
  addNumberedList([
    "Enter your student email address",
    "Enter your password",
    "Click the 'Login' button",
    "If credentials are correct, you will be taken to the booking page",
  ]);

  addSubHeader("Important Login Information");
  addBulletList([
    "Only students can log in through the student portal",
    "Your account must be active to use the system",
    "For security, the system will automatically log you out after 5 minutes of inactivity",
    "If you forget your password, contact the administrator",
  ]);

  // Page 4 - How to Book a Computer
  doc.addPage();
  addHeader("4. How to Book a Computer");

  addSubHeader("Step-by-Step Booking Process");

  addText("Step 1: Select Date, Time, and Duration");
  addBulletList([
    "Choose a date (Today or Tomorrow)",
    "Select your preferred time slot (9:00 AM to 6:30 PM)",
    "Choose how long you need the computer (15 minutes to 3 hours)",
  ]);

  doc.moveDown(0.5);
  addText("Step 2: Choose Computer Type");
  addBulletList([
    "Select either 2D or 3D workstation based on your needs",
    "The system will show available computers for your selected time",
  ]);

  doc.moveDown(0.5);
  addText("Step 3: Select a Computer");
  addBulletList([
    "View all computers with their current status",
    "Green = Available, Red = Already Booked",
    "Click on an available computer to select it",
    "You can see the computer name and location",
  ]);

  doc.moveDown(0.5);
  addText("Step 4: Confirm and Book");
  addBulletList([
    "Review your selection",
    "Check the availability message",
    "Click 'Book Now!' button",
    "Wait for confirmation",
  ]);

  doc.moveDown(0.5);
  addText("Step 5: Booking Confirmation");
  addBulletList([
    "You will see a confirmation screen with all your booking details",
    "Note down the computer name and time",
    "You can book another computer or logout",
  ]);

  // Page 5 - Computer Types
  doc.addPage();
  addHeader("5. Computer Types");

  addSubHeader("Understanding Computer Types");

  doc.moveDown(0.5);
  addText("2D Workstations", { underline: true });
  addText("Best suited for:");
  addBulletList([
    "Document creation and editing",
    "Web browsing and research",
    "2D graphic design",
    "Basic photo editing",
    "Coding and programming",
    "General office work",
  ]);

  doc.moveDown(0.5);
  addText("3D Workstations", { underline: true });
  addText("Best suited for:");
  addBulletList([
    "3D modeling and animation",
    "Video editing and rendering",
    "Game development",
    "CAD software",
    "Heavy graphics work",
    "Simulation software",
  ]);

  doc.moveDown(1);
  addSubHeader("Choosing the Right Computer");
  addText(
    "Select the computer type that matches your task requirements. If you are unsure, ask the lab assistant for guidance."
  );

  // Page 6 - Booking Rules and Limits
  doc.addPage();
  addHeader("6. Booking Rules and Limits");

  addSubHeader("Daily Time Limits");
  addText(
    "Each student has a daily time limit for computer usage. This limit may vary by student:"
  );
  addBulletList([
    "Standard limit: 3 hours per day (can be customized by admin)",
    "Your remaining time is displayed at the top of the booking page",
    "Time resets at midnight every day",
    "You cannot book more time than you have remaining",
  ]);

  addSubHeader("Booking Time Slots");
  addBulletList([
    "Minimum booking duration: 15 minutes",
    "Maximum booking duration: 3 hours",
    "Available durations: 15 min, 30 min, 45 min, 1 hour, 1.5 hours, 2 hours, 3 hours",
    "Operating hours: 9:00 AM to 7:00 PM",
    "Last booking slot: 6:30 PM",
  ]);

  addSubHeader("Booking Schedule");
  addBulletList([
    "You can book for Today or Tomorrow",
    "Bookings open every day during operating hours",
    "Sundays are closed (no bookings)",
    "Holiday closures will be displayed in the system",
  ]);

  addSubHeader("Booking Restrictions");
  addBulletList([
    "You cannot book a time that has already passed",
    "You cannot book if the computer is already reserved",
    "You cannot exceed your daily time limit",
    "Past times are disabled automatically",
  ]);

  // Page 7 - Managing Your Bookings
  doc.addPage();
  addHeader("7. Managing Your Bookings");

  addSubHeader("Viewing Your Bookings");
  addText(
    "To see all your bookings, click on the 'My Bookings' tab at the top of the booking page."
  );

  addSubHeader("Booking Information");
  addText("For each booking, you can see:");
  addBulletList([
    "Computer name",
    "Booking status (Active, Pending, Completed, Cancelled)",
    "Date of booking",
    "Start time and end time",
    "Duration in minutes",
    "Computer type",
  ]);

  addSubHeader("Booking Status Meanings");
  addBulletList([
    "Active - Your current ongoing booking",
    "Pending - Upcoming future booking",
    "Completed - Past booking that has ended",
    "Cancelled - Booking was cancelled",
  ]);

  addSubHeader("Automatic Updates");
  addText(
    "The My Bookings list updates automatically every 5 seconds, so you always see the latest information without refreshing the page."
  );

  // Page 8 - Important Information
  doc.addPage();
  addHeader("8. Important Information");

  addSubHeader("Before Your Booking Time");
  addBulletList([
    "Arrive at the lab at least 5 minutes before your booking starts",
    "Bring any materials or storage devices you need",
    "Know which computer you booked (check the computer name)",
  ]);

  addSubHeader("During Your Booking");
  addBulletList([
    "Use only the computer you booked",
    "Save your work regularly",
    "Be mindful of your end time",
    "Respect other students' bookings",
    "Do not extend your time without rebooking",
  ]);

  addSubHeader("After Your Booking");
  addBulletList([
    "Save and close all your files",
    "Log out of all accounts and programs",
    "Leave the workstation clean",
    "Report any issues to the lab staff",
    "Exit on time for the next user",
  ]);

  addSubHeader("Security and Privacy");
  addBulletList([
    "The system automatically logs you out after 5 minutes of inactivity",
    "Always log out when done booking",
    "Do not share your login credentials",
    "Your booking information is private",
  ]);

  addSubHeader("Real-time Updates");
  addBulletList([
    "Available computers update every second",
    "If a computer gets booked while you are viewing, you will see it immediately",
    "Your daily usage updates every 5 seconds",
    "No need to refresh the page manually",
  ]);

  // Page 9 - Troubleshooting
  doc.addPage();
  addHeader("9. Troubleshooting");

  addSubHeader("Common Issues and Solutions");

  doc.moveDown(0.5);
  addText("Problem: Cannot log in", { underline: true });
  addText("Solutions:");
  addBulletList([
    "Check that you are using your correct student email",
    "Verify your password is correct",
    "Make sure your account is active",
    "Contact the administrator if the issue persists",
  ]);

  doc.moveDown(0.5);
  addText("Problem: No computers available", { underline: true });
  addText("Solutions:");
  addBulletList([
    "Try selecting a different time slot",
    "Check if the other computer type has availability",
    "Try booking for tomorrow instead",
    "Wait a few minutes and refresh to see if something becomes available",
  ]);

  doc.moveDown(0.5);
  addText("Problem: Cannot select duration", { underline: true });
  addText("Solutions:");
  addBulletList([
    "Check your remaining daily time limit",
    "The duration options are limited by your remaining time",
    "If you have less than 15 minutes remaining, you cannot book",
    "Daily limits reset at midnight",
  ]);

  doc.moveDown(0.5);
  addText("Problem: Account disabled message", { underline: true });
  addText("Solutions:");
  addBulletList([
    "Your account may have been temporarily disabled",
    "Contact the administrator immediately",
    "Do not attempt to create a new account",
  ]);

  doc.moveDown(0.5);
  addText("Problem: Booking button is disabled", { underline: true });
  addText("Solutions:");
  addBulletList([
    "Make sure you selected all required fields",
    "Check if the computer is still available",
    "Verify you have not exceeded your daily limit",
    "Wait for the availability check to complete",
  ]);

  // Page 10 - Contact Information
  doc.addPage();
  addHeader("10. Contact Information");

  addSubHeader("Need Help?");
  addText(
    "If you encounter any problems or have questions about the workstation booking system, please contact:"
  );

  doc.moveDown(1);
  addText("Lab Administrator", { underline: true, fontSize: 14 });
  addText("For technical support and booking issues");
  doc.moveDown(0.5);

  addText("IT Support", { underline: true, fontSize: 14 });
  addText("For login problems and account access");
  doc.moveDown(0.5);

  addText("Front Desk", { underline: true, fontSize: 14 });
  addText("For on-site assistance and computer issues");
  doc.moveDown(1);

  addSubHeader("Feedback");
  addText(
    "We welcome your feedback to improve the booking system. If you have suggestions or encounter any issues, please let us know."
  );

  // Additional Information Page
  doc.addPage();
  addHeader("Additional Tips for Students");

  addSubHeader("Best Practices");
  addBulletList([
    "Book your computer in advance when possible",
    "Plan your work according to your time limit",
    "Check the 'My Bookings' tab regularly",
    "Arrive on time for your booking",
    "Log out properly after booking",
  ]);

  addSubHeader("Maximizing Your Time");
  addBulletList([
    "Come prepared with your materials",
    "Have your project files ready on a USB drive or cloud storage",
    "Know which software you need to use",
    "Save frequently during your session",
    "Clean up before your time ends",
  ]);

  addSubHeader("Being a Good Lab User");
  addBulletList([
    "Keep the workspace clean",
    "Use headphones for audio",
    "Respect quiet study areas",
    "Do not disturb others",
    "Report any equipment problems",
    "Follow all lab rules and policies",
  ]);

  addSubHeader("Remember");
  addText(
    "The workstation booking system is designed to give all students fair and equal access to computing resources. By following these guidelines and using the system properly, you help create a better experience for everyone."
  );

  doc.moveDown(2);
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Thank you for using the Workstation Booking System!", {
      align: "center",
    });

  // Finalize PDF
  doc.end();

  console.log(`✅ Documentation PDF generated: ${outputPath}`);
  return outputPath;
}

// Run the generator
try {
  const pdfPath = generateWorkstationDocumentation();
  console.log(`📄 Student guide created successfully at: ${pdfPath}`);
  console.log(`📖 The PDF contains comprehensive instructions for students`);
} catch (error) {
  console.error("❌ Error generating PDF:", error);
  process.exit(1);
}
