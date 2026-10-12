HOW TO UPLOAD TO GITHUB (important)
====================================

1. Download and EXTRACT this zip on your computer.
2. You will see folders:  components/   app/   public/

3. On GitHub → your FREDDY-NAILS repo:

   A. Open the "components" folder in the repo
      → Upload / replace these files INTO components/
         ShapeGuide.js          ← REQUIRED (has the real finger photos)
         ColourPalette.js
         BookingCalendar.js
         Booking.js
         Header.js

   B. Open the "app" folder in the repo
      → Upload / replace:
         page.js
         sitemap.js

   C. Optional: public/gallery/ → create "shapes" folder
      → Upload the 6 .jpg files

DO NOT upload files into the repo ROOT.
ShapeGuide.js must live at:  components/ShapeGuide.js

4. Commit changes
5. Wait for Vercel → hard refresh phone

After deploy you should see real finger photos, not boxy tips.
