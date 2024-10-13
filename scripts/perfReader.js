let performances = [];
let error=false;

/** Generates pop up showing the latest performance. Intended for use on home page. */
window.generatePopup = async function(){
    await loadPerfs();
    if(error){
        return;
    }
    const upcomingPerfs = performances.filter(p=>isUpcoming(p));
    if(upcomingPerfs.length === 0){
        return;
    }
    const nextPerf = upcomingPerfs[upcomingPerfs.length-1];

    const popup=htmlToNode('<div style="z-index:999" class="toast float-left fade show" role="alert" aria-live="assertive" aria-atomic="true" data-autohide="false" data-animation="true"></div>');
    popup.innerHTML=`<div class="toast-header bg-info text-white">
    Next concert: &nbsp
    <strong class="mr-auto"><a style="color: #333" href="pages/performances.html">${nextPerf.title}</a></strong> 
    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  <div class="toast-body">
      ${formatDate(nextPerf.date)} - ${nextPerf.location}
  </div>`;
  document.body.appendChild(popup);

  
  $('[data-toggle="tooltip"]').tooltip();
  $('.toast').toast('show');
}

/** Generate list of performances for the performances page, drawing from JSON */
window.renderPerformances = async function(){
    await loadPerfs();
    if(error){
        document.body.appendChild(htmlToNode(`<h4 style="color:red">Error! See console window.</h4>`));
        return;
    }    

    // Upcoming performances
    let row; 
    const upcomingPerfs = performances.filter(p=>isUpcoming(p));
    console.log("Upcoming performances");
    console.log(upcomingPerfs);
    const upDiv = document.getElementById('upcoming_perfs');

    if(upcomingPerfs.length === 0){
        upDiv.appendChild(htmlToNode(`<p>To be announced! Stay posted...</p>`));
    }
    for(let k=0; k<upcomingPerfs.length; k++)
    {
        if(!row || k % 2 === 0){
            row = getRow();
            upDiv.appendChild(row);
        }
        row.appendChild(getCard(upcomingPerfs[k]));
    }
    
    // Past performances
    const pastPerfs = performances.filter(p=>!isUpcoming(p));
    const ppDiv=document.getElementById('past_perfs');
    for(let k=0; k<pastPerfs.length; k++)
    {
        if(!row || k % 2 === 0){
            row = getRow();
            ppDiv.appendChild(row);
        }
        row.appendChild(getCard(pastPerfs[k]));
    }
}

function getCard(performance){
    const card=htmlToNode(`<div class="col mb-4">`);
   
    const innerCard = htmlToNode('<div class="card h-100"></div>');
   
    const img = htmlToNode(`<img src="${performance.imgUrl}" class="card-img-top" alt="#" />`);
    if(performance.ticketsUrl){
        const imgLink = htmlToNode(`<a href="${performance.ticketsUrl}" target="_blank"></a>`);
        imgLink.appendChild(img);
        innerCard.appendChild(imgLink);
    }
    else{
        innerCard.appendChild(img);
    }

    const cardBody = htmlToNode(`<div class="card-body"></div>`);
    
    cardBody.appendChild(htmlToNode(`<h5 class="card-title">${performance.title}</h5>`));
    cardBody.appendChild(htmlToNode(`<h6 class="card-subtitle mb-2 text-muted">${formatDate(performance.date)}</h6>`));

    // Location
    const location = htmlToNode(`<h6 class="card-subtitle mb-2 text-muted"></h6>`);
    if(performance.locationUrl){
        location.appendChild(htmlToNode(`<a href="${performance.locationUrl}" target="_blank">${performance.location}</a>`))
    }
    else{
        location.innerHTML=performance.location;
    }
    cardBody.appendChild(location);

    cardBody.appendChild(htmlToNode(`<p class="card-text">${performance.description}</p>`));

    if(performance.ticketsUrl){
        cardBody.appendChild(htmlToNode(`<p><a href="${performance.ticketsUrl}" id="link" class="card-link" target="_blank">Buy tickets here</a>.</p>`));
    }

    if(performance.concertProgramUrl){
        cardBody.appendChild(htmlToNode(`<p>Read the <a href="${performance.concertProgramUrl}" id="link" class="card-link" target="_blank">concert program</a>.</p>`));
    }

    innerCard.appendChild(cardBody);
    card.appendChild(innerCard);
    return card;
}

function getRow(){
    return htmlToNode(`<div class="row row-cols-1 row-cols-md-2 card-deck"></div>`);
}

function htmlToNode(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const nNodes = template.content.childNodes.length;
    if (nNodes !== 1) {
        throw new Error(
            `html parameter must represent a single node; got ${nNodes}. ` +
            'Note that leading or trailing spaces around an element in your ' +
            'HTML, like " <img/> ", get parsed as text nodes neighbouring ' +
            'the element; call .trim() on your input to avoid this.'
        );
    }
    return template.content.firstChild;
}


function isUpcoming(performance){
    const gracePeriod = 6 * 60 * 60 * 1000; // 6 hours
    return performance.date.getTime() + gracePeriod - new Date().getTime() > 0
}

async function loadPerfs(){
    const response = await fetch('../config/performances.json');
    const perfs = await response.json();

    for(const perf of perfs){
        try{
            if(!perf.title){
                addError('No performance name given!');
            }
            if(!perf.imgUrl){
                addError('No img url provided!');
            }
            const parsedDate = new Date(perf.date + " PST");
            if(isNaN(parsedDate)){
                addError(`Date format incorrect: ${perf.date}. We expect a date with a format like "May 25, 2024 8:00 pm"`);
            }
            perf.date = parsedDate;
            performances.push(perf);    
        } catch(e){
            console.error(`Error with performance entry: ${perf.name}`);
            console.error(e);
        }
    }
    const perf2 = performances.sort((p1, p2) => p2.date - p1.date);
    console.log(perf2);
}


async function addError(text){
    error=true;
    console.error(text);
}

function formatDate(date) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const hours = date.getHours() % 12 || 12; // 12-hour format
    const minutes = date.getMinutes();
    const ampm = date.getHours() >= 12 ? 'pm' : 'am';
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
  
    // Suffix for the day (st, nd, rd, th)
    const daySuffix =
      day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';
  
    // Format the minutes: include them only if they are non-zero
    const minuteString =
      minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
  
    return `${monthName} ${day}${daySuffix}, ${year} at ${hours}${minuteString} ${ampm}`;
  }
  