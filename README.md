# Ensemble Continuo

Now hosted with 11ty and Nunchucks templates. .html files are now .ntk files, and all pages use the main.ntk template.

Site is deployed nightly using GitHub Actions (primarily to update the performances page), as well as with every push to the main branch. 

### To host:
- To host locally, run `npm start`
- To view changes before submitting them, commit them to the dev branch, verify the Action built successfully, and view them on [this URL](https://default-9ca.pages.dev/). (Configured using Cloudflare using the EC email address.)
- To deploy, merge dev to the main branch.

### To update performances:

#### Part 1: generating the header image

1) Open pixlr at https://pixlr.com/editor/
2) Click "create new"
3) In the right column, enter the desired dimensions of 502x283
4) Click "Create"
5) Paste the image you want to use into the editor
6) Scale the image by clicking on it and holding down ctrl to constrain the dimensions
7) Go to file -> export -> quick export image as a png
8) Save the file YYMM_<Performance name>.png (with underscores instead of spaces) to the images directory

#### Part 2: Entering the JSON
- Add an entry to `performances.json` in the root of the repository, at the
  top of the list. Copy the shape of the example below.
- Add optional fields
  - concertProgramUrl: adds a link to the program in the description
  - locationUrl: not required but recommended. Link to Google Maps or a website for the venue.
  - ticketsUrl: not required but strongly recommended
  - timeTBD: set to `true` only if the start time genuinely is not settled yet

##### About the date

The build checks every date and **fails with an explanation** rather than
publishing a concert on the wrong day, so a mistake here cannot reach the
live site. Write the date the way you would say it:

    "November 22, 2024 8:00 pm"      "Nov 22, 2024 20:00"

Ordinals, weekday names and "at" are all fine — `Friday, November 22nd, 2024
at 8:00 p.m.` is understood. A start time is required, because visitors need
to know when to arrive; use `"timeTBD": true` if you truly do not have one.

Three things are rejected on purpose, because they look valid but are read as
the wrong date:

  - `2024-11-22` — a bare ISO date is treated as UTC and lands a day early
  - `November 22-23, 2024` — a range parses to an unrelated year
  - `11/22/24` — a two-digit year could mean either century


  {
    "title": "Britten - A Ceremony of Carols",
    "imgUrl": "/images/2411_Ceremony_of_Carols.png",
    "date": "November 22, 2024 8:00 pm",
    "location": "All Saints Episcopal Church",
    "locationUrl": "https://maps.app.goo.gl/vP2MkWfHHF59Rq6i9",
    "description": "Ensemble Continuo performs Britten A Ceremony of Carols and a journey through Baroque motets.",
    "ticketsUrl": "https://www.eventbrite.com/e/britten-a-ceremony-of-carols-tickets-1045064795937?utm-campaign=social&utm-content=attendeeshare&utm-medium=discovery&utm-term=listing&utm-source=cp&aff=ebdsshcopyurl"
  },
 