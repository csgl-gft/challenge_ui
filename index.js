/**
 * This javascript file will constitute the item point of your solution.
 *
 * Edit it as you need.  It currently contains things that you might find helpful to get started.
 */

// This is not really required, but means that changes to index.html will cause a reload.
require('./site/index.html')
// Apply the styles in style.css to the page.
require('./site/style.css')

// if you want to use es6, you can do something like
//     require('./es6/myEs6code')
// here to load the myEs6code.js file, and it will be automatically transpiled.

// Change this to get detailed logging from the stomp library
global.DEBUG = false

const url = "ws://localhost:8011/stomp"
const client = Stomp.client(url)
client.debug = function(msg) {
  if (global.DEBUG) {
    console.info(msg)
  }
}

//Prices is the main object where prices are goint to be saved
let prices = []

//CONTROLER
//Subscribe to Stomp topic
function connectCallback() {
  var newPriceObtained = function(message){
    registerNewPrice(JSON.parse(message.body));
    printTable();
  }
  const topic = '/fx/prices'
  var sub = client.subscribe(topic, newPriceObtained)
}

client.connect({}, connectCallback, function(error) {
  alert(error.headers.message)
})

//If new price has been obtained from Stomp, find it in the prices object and/or insert it as new
function registerNewPrice(price){
  //Init sparkline value
  initSparkArray(price);

  //Search the item already exists on prices
  let currentIndexLocation = -1
  for (const [index, el] of prices.entries()) {
    if(el['name'] == price['name']){
      currentIndexLocation = index
      break
    }
  }

  // If exists, remove it from prices and update it's contents with new spark value
  if(currentIndexLocation > -1){
    let currentPrice = prices.splice(currentIndexLocation, 1)[0] //remove previous price
    currentPrice['sparkline'].forEach((item, i) => {
      if(item['time'] > Date.now() - 30000){
        price['sparkline'].push(item);
      }
    });
    price['sparkline'].sort((a,b) => {return a['time'] - b['time']});
  }

  //Calculate new position on array
  let newIndex = prices.length
  for (const [index, el] of prices.entries()) {
    if(price['lastChangeBid'] < el['lastChangeBid'] && newIndex > index){
      newIndex = index
      break
    }
  }
  //insert it in the position
  prices.splice(newIndex, 0, price);

}

//Create a new spark item
function initSparkArray(price){
  let spark = {};
  spark['value']= price['bestBid']+price['bestAsk']/2
  spark['time']= Date.now()

  price['sparkline'] = [spark]
}


//PRINT
// Create a new Table object and refresh its contents on the page
function printTable(){
    let tablediv = document.getElementById('sorted-table')

    var table = document.createElement('table')
    var header = table.createTHead().insertRow(0);

    header.insertCell('0').innerHTML='Name'
    header.insertCell('1').innerHTML='Current best bid price'
    header.insertCell('2').innerHTML='Current best ask price'
    header.insertCell('3').innerHTML='Amount best bid price changed'
    header.insertCell('4').innerHTML='Amount best ask price changed'
    header.insertCell('5').innerHTML='Sparkline'

    var tableBody = document.createElement('tbody')

    prices.forEach((item, i) => {
      createRow(tableBody, item)
    });

    table.appendChild(tableBody)

    tablediv.innerHTML = '';
    tablediv.appendChild(table)

    //After the item has been inserted on the page, Sparkline can draw
    printSparkItems()
}

function createRow(tableBody, item){
    let row = document.createElement('tr')

    let cellhtml = '<td>'+item['name']+'</td><td>'
                         +item['bestBid']+'</td><td>'
                         +item['bestAsk']+'</td><td>'
                         +item['lastChangeBid']+'</td><td>'
                         +item['lastChangeAsk']+'</td><td>'
                         +'<span id="'+item['name']+'Spark" /></td><td>'
                   +'</td>'
    row.innerHTML=cellhtml
    tableBody.appendChild(row)
}

function createCell(text, row){
      var cell = document.createElement('td')
      cell.appendChild(document.createTextNode(text))
      console.log(text)
      row.appendChild(cell)
}

function printSparkItems(){
  prices.forEach((item, i) => {
    let sparkSpan = document.getElementById(item['name']+'Spark')

    var sparkArray = []
    item['sparkline'].forEach((item, i) => {
      sparkArray.push(item['value']);
    });

    Sparkline.draw(sparkSpan, sparkArray);
  })
}
