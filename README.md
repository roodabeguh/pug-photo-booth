# Secret Pug Petting Zoo — Photo Booth

The iPad posts each photo to your site and shows a QR code. The guest scans it to save
the photo on their phone. Every photo also lands in an event gallery the host can share.

## How a photo gets to the iPad
Fujifilm has no developer API for the Instax Mini Evo, so the Instax Mini Evo app moves
each shot from the camera to the iPad's Photos. Then tap "Load the photo" on the kiosk.

## Deploy (one time)
1. Install Node.js, then the Netlify CLI:  npm install -g netlify-cli
2. In this folder:  npm install
3. netlify login
4. netlify init   (create a new site)
5. In Netlify: Site configuration > Environment variables, add
   BOOTH_KEY = a long random password (only the iPad knows it)
6. netlify deploy --prod
   (Use the CLI or a Git-connected deploy. Drag-and-drop won't build the functions.)

## iPad setup
1. Open the site in Safari, tap Share > Add to Home Screen, and open it from the icon
   so it runs full screen.
2. Tap the logo 3 times to open Settings. Enter the booth key and an event name
   such as smith-wedding-x7k2 (the random ending keeps the gallery private).
3. Settings shows the gallery link to send the host.
4. Turn on Guided Access (Settings > Accessibility > Guided Access) and triple-click
   the side/home button to lock the iPad to the booth.

## Each guest
Load the photo > Post photo > guest scans the QR code > Next guest.
The screen resets on its own after 2 minutes.

## Files
public/index.html        iPad kiosk
public/gallery.html      guest page and event gallery
netlify/functions/       upload, list and serve photos (stored in Netlify Blobs)

## Notes
- Anyone with an event's gallery link can see its photos. Use a hard-to-guess event name.
- To remove photos, delete them under Blobs > booth-photos in the Netlify dashboard.
