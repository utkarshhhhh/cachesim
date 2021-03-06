
var canvas;
var context;
var cycleCount = 0;
var cellWidth = 10; 

var L1Cache;
var L2Cache;

var CPU = { x: 50, y:150, w: 20, h: 20, colour: "rgb(255,0,0)", lineColour:"rgb(0,0,0)", title: "CPU", latency: 0, cache: undefined }
var LSU = { x: 0, y: 0, w: 1, h: 4, colour: "rgb(255,255,255)", lineColour: "rgb(0,0,0)", title: "LSU", latency: 0 , cache: undefined}
var L1 = { x: 0, y: 0, w: 8, h: 8, colour: "rgb(0,255,0)", lineColour: "rgb(0,0,0)", title: "L1$", latency: 4 , cache: undefined}
var L2 = { x: 0, y: 0, w: 18, h: 22, colour: "rgb(0,128,255)", lineColour: "rgb(0,0,0)", title: "L2$", latency: 30 , cache: undefined}
var MM = { x: 0, y: 0, w: 30, h: 60, colour: "rgb(255,255,0)", lineColour: "rgb(0,0,0)", title: "Main Memory", latency: 600 , cache: undefined}

var level = [LSU, L1, L2, MM];



var activeFetches = new Array();

// represents some memory
function fetchee(l, sX, sY, colour) {
    this.startX = sX;
    this.startY = sY;
    this.endX = level[l - 1].x + ((Math.round((sX - level[l].x )/cellWidth) % level[l - 1].w) * cellWidth);
    this.endY = level[l - 1].y + ((Math.round((sY - level[l].y) / cellWidth) % level[l - 1].h) * cellWidth);
    this.level = l;
    this.currentStep = 0;
    if (!colour)
	{
		// grab the colour from the current level of cache
		var cache = level[l].cache;
		if (cache)
		{
			this.colour = cache.GetEntryColour(sX,sY);
		}
		else
			this.colour = get_random_color();
	}
    else
        this.colour = colour;
        
}

// represents a cache (mainly for rendering). Stores the colours of the fetched memory.
function cache(HWLevel) {
    this.m_HWLevel = HWLevel;
    this.m_Entries = new Array(HWLevel.h);
    for (var i = 0; i < HWLevel.w; i++) {
        this.m_Entries[i] = new Array(HWLevel.w)
        for (var j = 0; j < HWLevel.h; j++) {
            this.m_Entries[i][j] = HWLevel.colour
//            this.m_Entries[i][j] = 'rgb(' + (j*i *16  % 255) + ',' + (i * 16 % 255) + ',' + ((j+i) * 16 % 255) + ')'; //HWLevel.colour;
        }
    }

    this.Clear = ClearCache;
    this.Render = RenderCache;
    this.Add = Add;
	this.GetEntryColour = GetEntryColour;
}

// pull out the colour of an entry at a given x,y
function GetEntryColour(inX,inY)
{
	var x = Math.floor((inX-this.m_HWLevel.x-1)/cellWidth);
	var y = Math.floor((inY-this.m_HWLevel.y-1)/cellWidth);
	return this.m_Entries[x][y];
}

function RenderCache() {
    for (var y = 0; y < this.m_HWLevel.h; y++) 
        for (var x = 0; x < this.m_HWLevel.w; x++) {
             context.fillStyle = this.m_Entries[x][y];
             context.fillRect(this.m_HWLevel.x + x * cellWidth, this.m_HWLevel.y + y * cellWidth, cellWidth, cellWidth);
    }
}

function Add(f) {
    var x = (f.startX - this.m_HWLevel.x)/cellWidth;
    var y = (f.startY - this.m_HWLevel.y)/cellWidth;
    this.m_Entries[x][y] = f.colour;
}

function ClearCache() {
    for (e in this.m_Entries)
        e = this.m_HWLevel.colour;
}

function get_random_color() {
    var color = 'rgb(';
    for (var i = 0; i < 3; i++ ) {
        color += Math.round(Math.random() * 255).toString();
        if (i != 2)
            color += ',';
        
    }
    color += ')';
    return color;
}

window.onload = function() {
    canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");
    context.font = "16pt Arial";

    L1.x = CPU.x + CPU.w * cellWidth - (L1.w * cellWidth + CPU.w * cellWidth / 10);
    L1.y = CPU.y + CPU.h * cellWidth - (L1.h * cellWidth + CPU.h * cellWidth / 10);

    L2.x = CPU.x + CPU.w * cellWidth + 70;
    L2.y = CPU.y;

    MM.x = L2.x + L2.w * cellWidth + 180;
    MM.y = CPU.y - 20;

    LSU.x = CPU.x + 20;
    LSU.y = L1.y;

    L1Cache = new cache(L1);
    L2Cache = new cache(L2);

	level[1].cache = L1Cache;
	level[2].cache = L2Cache;
	
    if (window.addEventListener) {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('click', HandleEvent, false);
        window.addEventListener('touchstart', HandleEvent, false);
    }
    window.setInterval(update, 16);
};


// draw a box with a border and title
function DrawBox(box) {
    context.beginPath();
    context.rect(box.x, box.y, box.w * cellWidth, box.h * cellWidth);

    context.fillStyle = box.colour;

    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = box.lineColour;
    context.stroke();
    if(box.title.length >0) {
        context.lineWidth = 1;
        context.textAlign = "center";
        context.fillStyle = box.lineColour;
        context.fillText(box.title, box.x + box.w * cellWidth / 2, box.y - 10);
    }
 
}

// text to be displayed for each entry
var desc = [
    ["Click on L1 to load from L1 Cache ","Click on L2 to load from that cache. ","Or click in Main Memory to load from there. "],
]

function update() 
{
// clear screen
    context.fillStyle = 'rgb(255,255,255)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

// draw boxes
	DrawBox(CPU);
    DrawBox(L1);
    DrawBox(L2);
    DrawBox(MM);
    //DrawBox(LSU);
    L1Cache.Render();
    L2Cache.Render();
    
    displayDesc(desc[0]);
    context.fillText("Cycle Count: " + cycleCount, CPU.x + 10, CPU.y + 20);
    cycleCount++;
    if (cycleCount > 100000) cycleCount = 0;
// draw animated 'fetches'
    var w = cellWidth;
    context.lineWidth = 1;
    context.strokeStyle = "black";
    
    for (var i = 0; i < activeFetches.length; i++) 
    {
        var f = activeFetches[i];
        f.currentStep++;
        var t = f.currentStep / level[f.level].latency;
    
        context.beginPath();
        context.fillStyle = f.colour;
        context.rect(f.startX + (f.endX - f.startX) * t, f.startY + (f.endY - f.startY) * t, w, w);
        context.fill();
        context.stroke();

        while (f != undefined && f.currentStep == level[f.level].latency) 
		{
            switch (f.level) 
			{
                case 2: //L1
                    {
                        var newFetchee = new fetchee(f.level - 1, f.endX, f.endY, f.colour);
                        activeFetches.push(newFetchee);
                        L1Cache.Add(newFetchee);
                        break;
                    }
                case 3: // L2
                    {
                        var newFetchee = new fetchee(f.level - 1, f.endX, f.endY, f.colour);
                        activeFetches.push(newFetchee);
                        L2Cache.Add(newFetchee);
                        break;
                    }
            }
            activeFetches.splice(i, 1);
            f = activeFetches[i];
        }
    }
}

function explode() {

}

function onKeyDown(ev) 
{
    if(ev.keyCode == 27) // ESC
    {
        explode();
        window.close();
    }
}

function triggerFetchAnim(l, x, y) {
    activeFetches.push(new fetchee(l, x, y));
}

function clickedIn(box, x, y) 
{
    if (x >= box.x && x <= box.x + box.w * cellWidth && y >= box.y && y <= box.y + box.h * cellWidth)
        return true;

    return false;
}


function HandleEvent(ev) {
    var posx, posy;


	if (ev.pageX || ev.pageY) 	{
		posx = ev.pageX;
		posy = ev.pageY;
	}
	else if (ev.clientX || ev.clientY) 	{
		posx = ev.clientX + document.body.scrollLeft
			+ document.documentElement.scrollLeft;
		posy = ev.clientY + document.body.scrollTop
			+ document.documentElement.scrollTop;
	}

	for (var i = 0; i < level.length; i++)
	{
	    if (clickedIn(level[i], posx, posy))
	        triggerFetchAnim(i, posx, posy);
    }
}

// update the description text
function displayDesc(text) 
{
    var rect = { x: 50, y: L2.h * cellWidth + L2.y + 50, w: 600, h: 120 };
    context.beginPath();
    context.rect(rect.x, rect.y, rect.w, rect.h);

    context.fillStyle = "#8ED6FF";
    context.fill();
    context.lineWidth = 0;
    context.strokeStyle = "#8ED6FF";
    context.stroke();

    context.fillStyle = "black";
    context.linewidth = '1';
    context.textAlign = "left";
    for (var i = 0; i < text.length; i++) {
    // first line is left justified, subsequent lines are indented by 60
        context.fillText(text[i], rect.x + 20, rect.y + (rect.h-(text.length-1)*20)/ 2 + i*22);
    }
}

