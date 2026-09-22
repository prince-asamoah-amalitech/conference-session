 # Build a small admin area for managing conference sessions.

/sessions shows a list of sessions. A search box filters the list, and the search term must survive a page refresh and be shareable as a link.
Clicking a session navigates to /sessions/:id and shows an edit form. /sessions/new shows the same form, empty, in create mode.
The edit form must validate, support a variable number of speakers, and warn the user if they try to navigate away with unsaved changes.
Any unknown URL shows a Not Found page.

The session feature area should be loaded lazily. Data comes from the provided SessionService — don't change its API.